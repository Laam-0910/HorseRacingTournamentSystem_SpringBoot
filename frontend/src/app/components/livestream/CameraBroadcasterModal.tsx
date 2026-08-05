import React, { useState, useEffect, useRef } from "react";
import { $t } from "../../../lib/i18n";
import { api, getWebSocketUrl } from "../../../lib/api";
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
  const [widgetSize, setWidgetSize] = useState<"small" | "medium">("small");
  const [isHidden, setIsHidden] = useState(false); // Hide camera window without stopping stream

  // Draggable State for Floating Camera Widget
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, video, a")) return;
    setIsDragging(true);
    const defaultX = typeof window !== "undefined" ? window.innerWidth - (widgetSize === "small" ? 340 : 500) : 100;
    const defaultY = typeof window !== "undefined" ? window.innerHeight - (widgetSize === "small" ? 240 : 330) : 100;
    const currentX = dragPos ? dragPos.x : defaultX;
    const currentY = dragPos ? dragPos.y : defaultY;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, video, a")) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    const defaultX = typeof window !== "undefined" ? window.innerWidth - (widgetSize === "small" ? 340 : 500) : 100;
    const defaultY = typeof window !== "undefined" ? window.innerHeight - (widgetSize === "small" ? 240 : 330) : 100;
    const currentX = dragPos ? dragPos.x : defaultX;
    const currentY = dragPos ? dragPos.y : defaultY;
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: currentX,
      initialY: currentY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 250, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragStartRef.current.initialY + deltaY));
      setDragPos({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.startX;
      const deltaY = touch.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 250, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragStartRef.current.initialY + deltaY));
      setDragPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  const isMobileDevice = typeof window !== "undefined" && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window));

  // Auto-config default settings based on device type (mobile vs laptop)
  const [resolution, setResolution] = useState<"360p" | "480p" | "720p" | "1080p">(() => {
    const saved = localStorage.getItem("cam_res");
    if (saved) return saved as any;
    return isMobileDevice ? "720p" : "480p"; // Laptop default: 480p for stability
  });
  const [targetFps, setTargetFps] = useState<number>(() => {
    const saved = localStorage.getItem("cam_fps");
    if (saved) return parseInt(saved, 10);
    return isMobileDevice ? 20 : 15; // Laptop default: 15fps to reduce lag
  });
  const [jpegQuality, setJpegQuality] = useState<number>(() => {
    const saved = localStorage.getItem("cam_quality");
    if (saved) return parseFloat(saved);
    return isMobileDevice ? 0.70 : 0.55; // Laptop default: lower quality for performance
  });
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<any>(null);
  const isWsReadyRef = useRef<boolean>(false); // Track WebSocket ready state
  const streamRef = useRef<MediaStream | null>(null); // Ref to track latest stream (avoids stale closure)
  const isEncodingFrameRef = useRef<boolean>(false); // Lock flag to prevent concurrent overlapping toBlob calls on mobile
  const frameSeqRef = useRef<number>(0); // Monotonic frame sequence counter



  const startCamera = async (mode: "environment" | "user") => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setError("");
      
      const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      let mediaStream: MediaStream | null = null;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (!isMobileDevice) {
          // Optimized high-performance Full HD resolution constraints for Laptop/Desktop Webcams
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                frameRate: { ideal: 30, max: 60 }
              }
            });
          } catch (lapErr) {
            console.warn("[Broadcaster] Laptop HD camera setup fallback:", lapErr);
          }
        }

        if (!mediaStream) {
          // Mobile & Fallback camera constraints (keep mobile behavior untouched)
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
      }

      if (!mediaStream) {
        throw new Error("HTTP_INSECURE_MOBILE");
      }

      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.play().catch(pErr => console.error("Play error:", pErr));
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError($t("Unable to activate camera automatically. Please click 'Allow' when prompted by your browser.", localStorage.getItem("app-lang") || "en"));
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    const wsUrl = getWebSocketUrl(`/ws/livestream/${raceId}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Broadcaster] WebSocket connected to Race #" + raceId);
      isWsReadyRef.current = true;
      // Check if camera is already ready using ref (avoids stale closure bug)
      if (streamRef.current && videoRef.current) {
        console.log("[Broadcaster] Camera already ready — starting stream immediately");
        ws.send(JSON.stringify({ type: "STREAM_STARTED", raceId }));
        setIsLive(true);
        startStreamInterval();
        api.post(`/races/${raceId}`, { streamMode: "WEBCAM" }).catch(err =>
          console.warn("[Broadcaster] Could not update streamMode:", err)
        );
      } else {
        console.log("[Broadcaster] WS ready, waiting for camera stream...");
      }
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
      // Use streamRef (not state) to avoid stale closure — releases hardware camera light
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [raceId]);

  // Periodic check to auto-terminate stream if Race, RaceMeeting, or Season becomes INACTIVE
  useEffect(() => {
    if (!isLive) return;
    const checkStatusTimer = setInterval(async () => {
      try {
        const raceData = await api.get<any>(`/public/races/${raceId}`);
        if (
          !raceData ||
          raceData.status !== "RUNNING" ||
          raceData.meetingStatus === "INACTIVE" ||
          raceData.meetingStatus === "CANCELLED" ||
          raceData.seasonStatus === "CLOSED" ||
          raceData.seasonStatus === "INACTIVE" ||
          raceData.seasonStatus === "CANCELLED"
        ) {
          setError("Livestream automatically stopped because the Season or Race Meeting was deactivated.");
          setTimeout(() => {
            handleStopLive();
          }, 2000);
        }
      } catch (err) {
        // Ignore transient network errors
      }
    }, 4000);

    return () => clearInterval(checkStatusTimer);
  }, [isLive, raceId]);

  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Auto-start streaming when BOTH WebSocket AND camera stream are ready
  // This fixes the race condition where ws.onopen fires before camera is available
  useEffect(() => {
    if (streamRef.current && isWsReadyRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isLive) {
      console.log("[Broadcaster] Camera stream ready & WS open — auto-starting stream!");
      // Notify peers and start interval immediately (non-blocking)
      wsRef.current.send(JSON.stringify({ type: "STREAM_STARTED", raceId }));
      setIsLive(true);
      startStreamInterval();
      // Fire API update in background (don't block stream)
      api.post(`/races/${raceId}`, { streamMode: "WEBCAM" }).catch(err =>
        console.warn("[Broadcaster] Could not update streamMode:", err)
      );
    }
  }, [stream]);

  const startStreamInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let targetWidth = 1280;
    if (resolution === "360p") targetWidth = 640;
    else if (resolution === "480p") targetWidth = 854;
    else if (resolution === "720p") targetWidth = 1280;
    else if (resolution === "1080p") targetWidth = 1920;

    const intervalMs = Math.max(25, Math.round(1000 / targetFps));

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }
    const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
    const enc = new TextEncoder();

    intervalRef.current = setInterval(() => {
      if (videoRef.current && ctx && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (wsRef.current.bufferedAmount > 256 * 1024) return;

        const video = videoRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const maxSide = targetWidth;
          let w = video.videoWidth;
          let h = video.videoHeight;

          if (w > maxSide || h > maxSide) {
            if (w >= h) {
              w = maxSide;
              h = Math.round((video.videoHeight / video.videoWidth) * maxSide);
            } else {
              h = maxSide;
              w = Math.round((video.videoWidth / video.videoHeight) * maxSide);
            }
          }

          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          ctx.drawImage(video, 0, 0, w, h);

          frameSeqRef.current = (frameSeqRef.current + 1) % 4294967290;
          const currentSeq = frameSeqRef.current;

          const dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
          const broadcasterId = user?.id ? `user_${user.id}_${camInstanceId}` : `anon_${camInstanceId}`;
          const uName = user?.fullName || user?.username || "Referee";
          const broadcasterName = `${uName} (Ref Cam #${camInstanceId.replace("cam_", "")})`;

          const metaStr = `${broadcasterId}|${broadcasterName}`;
          const metaBytes = enc.encode(metaStr);
          const imgBytes = enc.encode(dataUrl);
          const totalLen = 6 + metaBytes.byteLength + imgBytes.byteLength;

          const buffer = new ArrayBuffer(totalLen);
          const view = new DataView(buffer);
          view.setUint16(0, metaBytes.byteLength, true);
          view.setUint32(2, currentSeq, true);

          const u8 = new Uint8Array(buffer);
          u8.set(metaBytes, 6);
          u8.set(imgBytes, 6 + metaBytes.byteLength);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(buffer);
          }
        }
      }
    }, intervalMs);
  };

  useEffect(() => {
    localStorage.setItem("cam_res", resolution);
    localStorage.setItem("cam_fps", String(targetFps));
    localStorage.setItem("cam_quality", String(jpegQuality));

    if (isLive) {
      startStreamInterval();
    }
  }, [resolution, targetFps, jpegQuality]);

  const handleStartLive = async () => {
    try {
      await api.post(`/races/${raceId}`, { streamMode: "WEBCAM" });
      setIsLive(true);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "STREAM_STARTED", raceId }));
      }

      startStreamInterval();
    } catch (err: any) {
      setError("Failed to start livestream.");
    }
  };

  const handleStopLive = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsLive(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STREAM_STOPPED", raceId }));
    }
    await api.post(`/races/${raceId}`, { streamMode: "NONE" });
    onClose();
  };

  // Unified close: stop camera, stop stream, close WS, then call onClose
  const handleClose = () => {
    // 1. Stop frame interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    // 2. Notify peers stream stopped
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STREAM_STOPPED", raceId }));
    }
    // 3. Stop all camera tracks using REF (avoids stale closure — ensures hardware camera light turns off)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    // 4. Also stop state stream if different
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    // 5. Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    // 6. Update backend streamMode to NONE so race is no longer marked as live webcam
    api.post(`/races/${raceId}`, { streamMode: "NONE" }).catch(() => {});
    setIsLive(false);
    onClose();
  };

  // Master video stream binder
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.play().catch(e => console.error("Master video play error:", e));
    }
  }, [stream]);

  return (
    <>
      {/* Master Persistent Hidden Video for Continuous Frame Capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: "fixed", width: 1, height: 1, opacity: 0.001, pointerEvents: "none", zIndex: -100 }}
      />

      {/* Collapsed to Edge Tab when isMinimized && isHidden */}
      {isMinimized && isHidden && (
        <div
          onClick={() => setIsHidden(false)}
          style={{
            position: "fixed",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "linear-gradient(135deg, #1a0000, #2a0a0a)",
            border: "1px solid #ef4444",
            borderRight: "none",
            borderRadius: "10px 0 0 10px",
            padding: "12px 8px",
            cursor: "pointer",
            boxShadow: "-4px 0 20px rgba(239,68,68,0.4)",
            userSelect: "none",
          }}
          title="Click to show camera"
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "block", animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }} />
          <span style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontSize: "9px",
            fontWeight: "bold",
            color: "#ef4444",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
            lineHeight: 1.2,
          }}>LIVE CAM</span>
          <span style={{ fontSize: "14px", color: "#fff", marginTop: 2 }}>◀</span>
        </div>
      )}

      {/* Floating Minimized Widget */}
      {isMinimized && !isHidden && (
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ 
            position: "fixed", 
            left: dragPos ? `${dragPos.x}px` : undefined,
            top: dragPos ? `${dragPos.y}px` : undefined,
            bottom: dragPos ? undefined : 20, 
            right: dragPos ? undefined : 20, 
            zIndex: 99999, 
            width: widgetSize === "small" ? 320 : 480, 
            background: "#121110", 
            border: isDragging ? "2px solid #fbbf24" : "2px solid #ef4444", 
            borderRadius: "1rem", 
            boxShadow: isDragging ? "0 20px 50px rgba(251,191,36,0.4)" : "0 10px 40px rgba(0,0,0,0.9)", 
            overflow: "hidden", 
            padding: "0.6rem", 
            display: "flex", 
            flexDirection: "column", 
            gap: "0.5rem", 
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            transition: isDragging ? "none" : "border-color 0.2s, box-shadow 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} className="animate-ping" />
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ef4444", fontFamily: "monospace" }}>LIVE CAM #{raceId}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                onClick={() => setWidgetSize(prev => prev === "small" ? "medium" : "small")}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#60a5fa", borderRadius: "4px", padding: "3px 7px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
                title="Toggle size (Small / Medium)"
              >
                {widgetSize === "small" ? "🔍 480p" : "🔍 320p"}
              </button>
              <button
                onClick={() => setIsHidden(true)}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#a0a0a0", borderRadius: "4px", padding: "3px 7px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
                title="Collapse to edge (Keep Streaming)"
              >
                ▶▶ Hide
              </button>
              <button onClick={() => setIsMinimized(false)} style={{ background: "#c9a227", border: "none", color: "#000", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>📌 Expand</button>
              <button onClick={handleClose} style={{ background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: "4px", padding: "3px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }} title="Stop stream & close camera">⏹ Stop</button>
            </div>
          </div>
          <div style={{ width: "100%", height: widgetSize === "small" ? 170 : 260, background: "#000", borderRadius: "0.5rem", overflow: "hidden", position: "relative" }}>
            <PreviewVideo stream={stream} facingMode={facingMode} />
            <button
              onClick={toggleFacingMode}
              style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}
              title={$t("Switch front/rear camera", localStorage.getItem("app-lang") || "en")}
            >
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Full Modal Dialog */}
      {!isMinimized && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#121110", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "1.25rem", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem", position: "relative" }}>
            
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "0.75rem", position: "sticky", top: 0, background: "#121110", zIndex: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>📷</span>
                <div>
                  <h4 style={{ color: "#fff", margin: 0, fontSize: "1rem", fontWeight: "bold" }}>
                    {$t("Camera Broadcaster", localStorage.getItem("app-lang") || "en")}
                  </h4>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>Race #{raceId} {raceTitle ? `- ${raceTitle}` : ""}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  onClick={() => setShowSettings(prev => !prev)}
                  style={{ background: showSettings ? "rgba(201,162,39,0.25)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(201,162,39,0.3)", color: "#fbbf24", borderRadius: "0.5rem", padding: "6px 10px", fontSize: "11px", cursor: "pointer", fontWeight: "bold", fontFamily: "monospace" }}
                  title="Stream Quality & Graphics Settings"
                >
                  ⚙️ {resolution} @ {targetFps}FPS
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", border: "none", color: "#000", borderRadius: "0.5rem", padding: "6px 12px", fontSize: "11px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}
                  title="Minimize camera window to floating widget"
                >
                  📌 Minimize
                </button>
                <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontWeight: "bold" }}>✕</button>
              </div>
            </div>

            {/* Dynamic Quality Settings Panel */}
            {showSettings && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "0.75rem", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
                  <span>⚙️ STREAM QUALITY & HARDWARE ENCODER</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Live Realtime Adjustment</span>
                </div>

                {/* Preset Quick Mode Selection */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => { setResolution("480p"); setTargetFps(15); setJpegQuality(0.5); }}
                    style={{ flex: 1, padding: "6px 4px", background: resolution === "480p" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.05)", border: resolution === "480p" ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fbbf24", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    ⚡ Smooth (480p)
                  </button>
                  <button
                    onClick={() => { setResolution("720p"); setTargetFps(20); setJpegQuality(0.75); }}
                    style={{ flex: 1, padding: "6px 4px", background: resolution === "720p" ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)", border: resolution === "720p" ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#34d399", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    🌟 Standard HD (720p)
                  </button>
                  <button
                    onClick={() => { setResolution("1080p"); setTargetFps(24); setJpegQuality(0.85); }}
                    style={{ flex: 1, padding: "6px 4px", background: resolution === "1080p" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", border: resolution === "1080p" ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#818cf8", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    💎 Ultra HD (1080p)
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "9px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "3px" }}>Resolution</label>
                    <select
                      value={resolution}
                      onChange={e => setResolution(e.target.value as any)}
                      style={{ width: "100%", padding: "4px 6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", fontSize: "11px", fontFamily: "monospace" }}
                    >
                      <option value="360p">360p (640x360)</option>
                      <option value="480p">480p (854x480)</option>
                      <option value="720p">720p (1280x720)</option>
                      <option value="1080p">1080p (1920x1080)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "9px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "3px" }}>Frame Rate (FPS)</label>
                    <select
                      value={targetFps}
                      onChange={e => setTargetFps(parseInt(e.target.value))}
                      style={{ width: "100%", padding: "4px 6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", fontSize: "11px", fontFamily: "monospace" }}
                    >
                      <option value={5}>5 FPS</option>
                      <option value={10}>10 FPS</option>
                      <option value={15}>15 FPS</option>
                      <option value={24}>24 FPS</option>
                      <option value={30}>30 FPS</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "9px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "3px" }}>Compression</label>
                    <select
                      value={jpegQuality}
                      onChange={e => setJpegQuality(parseFloat(e.target.value))}
                      style={{ width: "100%", padding: "4px 6px", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff", fontSize: "11px", fontFamily: "monospace" }}
                    >
                      <option value={0.3}>30% (Low)</option>
                      <option value={0.5}>50% (Balanced)</option>
                      <option value={0.75}>75% (High)</option>
                      <option value={0.9}>90% (Ultra)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}>
                {error}
              </div>
            )}

            {/* Camera Preview Frame */}
            <div style={{ position: "relative", width: "100%", height: "260px", background: "#000", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
              <PreviewVideo stream={stream} facingMode={facingMode} />

              {!stream && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "1rem", zIndex: 15 }}>
                  <span style={{ fontSize: "2rem" }}>📷</span>
                  <button
                    onClick={() => startCamera(facingMode)}
                    style={{ padding: "0.75rem 1.25rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.4)" }}
                  >
                    {$t("👉 Click here to Turn On Camera (Allow)", localStorage.getItem("app-lang") || "en")}
                  </button>
                </div>
              )}

              {isLive && (
                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: "6px" }}>
                  <div style={{ background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 0 10px rgba(239,68,68,0.5)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }}></span>
                    LIVE BROADCASTING
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fbbf24", padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace" }}>
                    {resolution} • {targetFps} FPS
                  </div>
                </div>
              )}

              <button
                onClick={toggleFacingMode}
                style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}
                title={$t("Switch front/rear camera", localStorage.getItem("app-lang") || "en")}
              >
                🔄
              </button>
            </div>

            {/* Mobile Connection Helper */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.75rem" }}>
              <div style={{ fontWeight: "bold", color: "#fbbf24", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🌐</span> {$t("Mobile Camera Permission Setup (Chrome Android):", localStorage.getItem("app-lang") || "en")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: "0.7rem" }}>
                <div>
                  1. Open Chrome on mobile and visit: <code style={{ color: "#fbbf24", background: "rgba(0,0,0,0.4)", padding: "1px 4px", borderRadius: 3 }}>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>
                </div>
                <div>
                  2. Enter PC IP (e.g. <code style={{ color: "#fbbf24" }}>http://192.168.137.1:5173</code>) $\rightarrow$ Select <strong style={{ color: "#10b981" }}>Enabled</strong> $\rightarrow$ Click <strong style={{ color: "#fbbf24" }}>Relaunch</strong>.
                </div>
                <div>
                  3. Reopen website $\rightarrow$ Click <strong style={{ color: "#10b981" }}>Start Broadcasting</strong> $\rightarrow$ Select <strong style={{ color: "#10b981" }}>Allow Camera</strong>.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              {!isLive ? (
                <button
                  onClick={handleStartLive}
                  style={{ flex: 1, padding: "0.85rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <span>🔴</span> {$t("Start Broadcasting (Go Live)", localStorage.getItem("app-lang") || "en")}
                </button>
              ) : (
                <button
                  onClick={handleStopLive}
                  style={{ flex: 1, padding: "0.85rem", background: "rgba(255,255,255,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <span>⏹</span> {$t("Stop Stream (End Stream)", localStorage.getItem("app-lang") || "en")}
                </button>
              )}
              <button
                onClick={handleClose}
                style={{ padding: "0.85rem 1.25rem", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", fontWeight: "bold", fontSize: "0.85rem", cursor: "pointer" }}
              >
                {$t("Close", localStorage.getItem("app-lang") || "en")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper component to render video preview safely without unmounting master stream capture video
function PreviewVideo({ stream, facingMode }: { stream: MediaStream | null; facingMode: "user" | "environment" }) {
  const pRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (pRef.current && stream) {
      pRef.current.srcObject = stream;
      pRef.current.setAttribute("playsinline", "true");
      pRef.current.setAttribute("webkit-playsinline", "true");
      pRef.current.play().catch(e => console.error("Preview play error:", e));
    }
  }, [stream]);

  return (
    <video
      ref={pRef}
      autoPlay
      playsInline
      muted
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: facingMode === "user" ? "scaleX(-1)" : "none"
      }}
    />
  );
}
