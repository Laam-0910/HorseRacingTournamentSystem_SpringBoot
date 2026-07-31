import React, { useState, useEffect, useRef } from "react";
import { $t } from "../../../lib/i18n";
import { api } from "../../../lib/api";

interface Props {
  raceId: number;
  raceTitle?: string;
  onClose: () => void;
}

export default function CameraBroadcasterModal({ raceId, raceTitle, onClose }: Props) {
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [viewerCount, setViewerCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<any>(null);

  // Khởi tạo Camera
  const startCamera = async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError($t("Không thể mở Camera. Vui lòng cấp quyền camera/micro trên trình duyệt.", localStorage.getItem("app-lang") || "vi"));
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    // Mở kết nối WebSocket tín hiệu Livestream
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/livestream/${raceId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Broadcaster WebSocket connected to Race #" + raceId);
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

      // Phát khung hình với tốc độ 15-20 FPS
      intervalRef.current = setInterval(() => {
        if (videoRef.current && ctx && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const video = videoRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = 640;
            canvas.height = 360;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.5); // Nén nhẹ 50%
            wsRef.current.send(JSON.stringify({
              type: "FRAME",
              raceId,
              image: dataUrl,
              timestamp: Date.now()
            }));
          }
        }
      }, 66); // ~15 FPS
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
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontWeight: "bold" }}>✕</button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}>
            {error}
          </div>
        )}

        {/* Khung ngắm Camera Preview */}
        <div style={{ position: "relative", width: "100%", height: "300px", background: "#000", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />

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
