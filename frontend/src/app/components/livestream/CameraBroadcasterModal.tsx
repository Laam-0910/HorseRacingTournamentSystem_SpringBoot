import React, { useState, useEffect, useRef } from "react";
import { $t } from "../../../lib/i18n";
import { api } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

interface Props {
  raceId: number;
  raceTitle?: string;
  onClose: () => void;
}

export default function CameraBroadcasterModal({ raceId, raceTitle, onClose }: Props) {
  const { user } = useAuth();
  const [camInstanceId] = useState(() => "cam_" + Math.floor(100 + Math.random() * 900));
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState(false); // Persistent Floating Widget Mode

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Khởi tạo Camera với đa tầng dự phòng cho Điện thoại (Samsung & iPhone)
  const startCamera = async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setError("");
      
      let mediaStream: MediaStream | null = null;
      
      // Hỗ trợ lật camera trước (user) và camera sau (environment) trên điện thoại
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: mode } }
          });
        } catch (e1) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: mode } }
            });
          } catch (e2) {
            try {
              mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (e3) {
              console.warn("Camera fallback failed:", e3);
            }
          }
        }
      }

      if (!mediaStream) {
        throw new Error("HTTP_INSECURE_MOBILE");
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.play().catch(pErr => console.error("Play error:", pErr));
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError($t("Không thể kích hoạt Camera tự động. Vui lòng bấm 'Cho phép (Allow)' khi trình duyệt xin quyền, hoặc dùng nút 'Chụp/Tải Ảnh Máy Quay' ở bên dưới.", localStorage.getItem("app-lang") || "vi"));
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    // Mở kết nối WebSocket tín hiệu Livestream
    const hostname = window.location.hostname || "localhost";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${hostname}:8080/ws/livestream/${raceId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Broadcaster WebSocket connected to Race #" + raceId);
      // Tự động kích hoạt phát sóng Go Live ngay khi kết nối sẵn sàng
      handleStartLive();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "JOIN_VIEWER") {
          setViewerCount(prev => prev + 1);
        } else if (data.type === "LEAVE_VIEWER") {
          setViewerCount(prev => Math.max(0, prev - 1));
        }
      } catch (e) {
        // Ignore non-json
      }
    };

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (ws.readyState === WebSocket.OPEN) ws.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [raceId]);

  // Chuyển đổi Camera Trước / Sau
  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Bắt đầu Go Live
  const handleStartLive = async () => {
    try {
      // Cập nhật streamMode của Race trong DB thành WEBCAM
      await api.post(`/races/${raceId}`, { streamMode: "WEBCAM" });
      setIsLive(true);

      // Tạo canvas ẩn để capture khung hình phát qua WebSocket
      const canvas = document.createElement("canvas");
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d");

      // Gửi tín hiệu START STREAM
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "STREAM_STARTED", raceId }));
      }

      // Xóa interval cũ nếu có để tránh trùng lặp phát frame
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Phát khung hình với tốc độ 15 FPS nhẹ nhàng (480x270)
      intervalRef.current = setInterval(() => {
        if (videoRef.current && ctx && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const video = videoRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = 1280;
            canvas.height = 720;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.82); // Đồ họa Ultra HD 720p nét như truyền hình (~35KB/frame)
            const uName = user?.fullName || user?.username || "Trọng tài";
            const broadcasterId = user?.id ? `user_${user.id}_${camInstanceId}` : `anon_${camInstanceId}`;
            const broadcasterName = `${uName} (${camInstanceId.replace("cam_", "Cam ")})`;
            wsRef.current.send(JSON.stringify({
              type: "FRAME",
              raceId,
              broadcasterId,
              broadcasterName,
              image: dataUrl,
              timestamp: Date.now()
            }));
          }
        }
      }, 66); // ~15 FPS HD mượt mà sắc nét cao cấp
    } catch (err: any) {
      setError("Failed to start livestream.");
    }
  };

  // Dừng Go Live
  const handleStopLive = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsLive(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STREAM_STOPPED", raceId }));
    }
    // Trả về YOUTUBE mode mặc định
    await api.post(`/races/${raceId}`, { streamMode: "YOUTUBE" });
    onClose();
  };

  // Giữ luồng stream liên tục trên phần tử video khi đổi chế độ phóng to / thu nhỏ
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [stream, isMinimized]);

  if (isMinimized) {
    return (
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 99999, width: 320, background: "#121110", border: "2px solid #ef4444", borderRadius: "1rem", boxShadow: "0 10px 40px rgba(0,0,0,0.9)", overflow: "hidden", padding: "0.6rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} className="animate-ping" />
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ef4444", fontFamily: "monospace" }}>LIVE CAM #{raceId}</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => setIsMinimized(false)} style={{ background: "#c9a227", border: "none", color: "#000", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>📌 Phóng lớn</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
          </div>
        </div>
        <div style={{ width: "100%", height: 170, background: "#000", borderRadius: "0.5rem", overflow: "hidden", position: "relative" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
          <button
            onClick={toggleFacingMode}
            style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}
            title={$t("Lật camera trước/sau", localStorage.getItem("app-lang") || "vi")}
          >
            🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#121110", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "1.25rem", width: "100%", maxWidth: "600px", overflow: "hidden", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem" }}>
        
        {/* Header Modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>📱</span>
            <div>
              <h4 style={{ color: "#fff", margin: 0, fontSize: "1rem", fontWeight: "bold" }}>
                {$t("Mobile Camera Broadcaster", localStorage.getItem("app-lang") || "vi")}
              </h4>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>Race #{raceId} {raceTitle ? `- ${raceTitle}` : ""}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button onClick={() => setIsMinimized(true)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fbbf24", borderRadius: "0.375rem", padding: "4px 8px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}>📌 Thu nhỏ góc màn hình</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontWeight: "bold" }}>✕</button>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}

        {/* Khung ngắm Camera Preview */}
        <div style={{ position: "relative", width: "100%", height: "260px", background: "#000", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />

          {!stream && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "1rem", zIndex: 15 }}>
              <span style={{ fontSize: "2rem" }}>📷</span>
              <button
                onClick={() => startCamera(facingMode)}
                style={{ padding: "0.75rem 1.25rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.4)" }}
              >
                {$t("👉 Bấm vào đây để Bật Camera (Allow)", localStorage.getItem("app-lang") || "vi")}
              </button>
            </div>
          )}

          {/* Badge Trạng thái LIVE */}
          {isLive && (
            <div style={{ position: "absolute", top: 12, left: 12, background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 10px rgba(239,68,68,0.5)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }}></span>
              LIVE BROADCASTING
            </div>
          )}

          {/* Nút lật camera trước / sau */}
          <button
            onClick={toggleFacingMode}
            style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}
            title={$t("Lật camera trước/sau", localStorage.getItem("app-lang") || "vi")}
          >
            🔄
          </button>
        </div>

        {/* Hướng Dẫn Kết Nối Điện Thoại (Mobile Connection Helper) */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.75rem" }}>
          <div style={{ fontWeight: "bold", color: "#fbbf24", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🌐</span> {$t("Bật quyền Camera Điện thoại khi kết nối qua IP (Chrome Android):", localStorage.getItem("app-lang") || "vi")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: "0.7rem" }}>
            <div>
              1. Mở Chrome trên Điện thoại gõ đường dẫn: <code style={{ color: "#fbbf24", background: "rgba(0,0,0,0.4)", padding: "1px 4px", borderRadius: 3 }}>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>
            </div>
            <div>
              2. Điền IP của máy tính (ví dụ: <code style={{ color: "#fbbf24" }}>http://192.168.137.1:5173</code>) $\rightarrow$ Chọn <strong style={{ color: "#10b981" }}>Enabled</strong> $\rightarrow$ Bấm <strong style={{ color: "#fbbf24" }}>Relaunch</strong>.
            </div>
            <div>
              3. Mở lại trang web $\rightarrow$ Bấm <strong style={{ color: "#10b981" }}>Bắt đầu phát sóng</strong> $\rightarrow$ Chọn <strong style={{ color: "#10b981" }}>Cho phép (Allow Camera)</strong>.
            </div>
          </div>
        </div>

        {/* Nút điều khiển Live */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {!isLive ? (
            <button
              onClick={handleStartLive}
              style={{ flex: 1, padding: "0.85rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <span>🔴</span> {$t("Bắt đầu phát sóng (Go Live)", localStorage.getItem("app-lang") || "vi")}
            </button>
          ) : (
            <button
              onClick={handleStopLive}
              style={{ flex: 1, padding: "0.85rem", background: "rgba(255,255,255,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <span>⏹</span> {$t("Dừng phát sóng (End Stream)", localStorage.getItem("app-lang") || "vi")}
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: "0.85rem 1.25rem", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.85rem", cursor: "pointer" }}
          >
            {$t("Close", localStorage.getItem("app-lang") || "vi")}
          </button>
        </div>

      </div>
    </div>
  );
}
