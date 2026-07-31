import React, { useState, useEffect, useRef } from "react";
import { $t } from "../../../lib/i18n";

interface Props {
  raceId: number;
}

export default function WebCamLiveViewer({ raceId }: Props) {
  const [frame, setFrame] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const lastFrameTimeRef = useRef<number>(0);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/livestream/${raceId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Viewer Connected to WebCam Stream #" + raceId);
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "JOIN_VIEWER", raceId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "FRAME" && data.image) {
          setFrame(data.image);
          setIsReceiving(true);
          lastFrameTimeRef.current = Date.now();

          // Reset timeout kiểm tra mất tín hiệu
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            if (Date.now() - lastFrameTimeRef.current > 3000) {
              setIsReceiving(false);
            }
          }, 3000);
        } else if (data.type === "STREAM_STOPPED") {
          setIsReceiving(false);
          setFrame(null);
        }
      } catch (e) {
        // Ignore
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsReceiving(false);
    };

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "LEAVE_VIEWER", raceId }));
        ws.close();
      }
    };
  }, [raceId]);

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {frame && isReceiving ? (
        <img
          src={frame}
          alt="Live WebCam Stream"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-2" />
          <p className="text-amber-400 font-semibold text-sm">
            {$t("Đang chờ kết nối Camera phát sóng trực tiếp từ Trọng tài...", localStorage.getItem("app-lang") || "vi")}
          </p>
          <p className="text-white/40 text-xs font-mono">
            {isConnected ? "Connected to WebSocket Server. Waiting for frames..." : "Connecting to Stream Server..."}
          </p>
        </div>
      )}

      {/* Live Badge Overlay */}
      {isReceiving && (
        <div className="absolute top-4 left-4 bg-rose-600/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-2 backdrop-blur-md shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>WEBCAM LIVE</span>
        </div>
      )}
    </div>
  );
}
