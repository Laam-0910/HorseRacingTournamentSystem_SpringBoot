import React, { useState, useEffect, useRef } from "react";
import { $t } from "../../../lib/i18n";

export interface BroadcasterInfo {
  id: string;
  name: string;
}

interface Props {
  raceId: number;
  selectedBroadcasterId?: string | null;
  onBroadcastersFound?: (list: BroadcasterInfo[]) => void;
}

export default function WebCamLiveViewer({ raceId, selectedBroadcasterId, onBroadcastersFound }: Props) {
  const [broadcasterFrames, setBroadcasterFrames] = useState<Record<string, { image: string; name: string; lastSeen: number }>>({});
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeBroadcasterList, setActiveBroadcasterList] = useState<BroadcasterInfo[]>([]);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const hostname = window.location.hostname || "localhost";
    const port = window.location.port ? `:${window.location.port}` : "";
    const wsUrl = window.location.protocol === "https:"
      ? `wss://${hostname}${port}/ws/livestream/${raceId}`
      : `ws://${hostname}:8080/ws/livestream/${raceId}`;
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
          const bId = data.broadcasterId || "default_broadcaster";
          const bName = data.broadcasterName || "Trọng tài phát sóng";

          setBroadcasterFrames(prev => {
            const next = {
              ...prev,
              [bId]: {
                image: data.image,
                name: bName,
                lastSeen: Date.now()
              }
            };
            return next;
          });
        } else if (data.type === "STREAM_STOPPED") {
          const bId = data.broadcasterId || "default_broadcaster";
          setBroadcasterFrames(prev => {
            const next = { ...prev };
            delete next[bId];
            return next;
          });
        }
      } catch (e) {
        // Ignore
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "LEAVE_VIEWER", raceId }));
        ws.close();
      }
    };
  }, [raceId]);

  // Tự động kiểm tra và dọn dẹp các máy quay ngắt kết nối (> 15 giây không gửi frame)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      setBroadcasterFrames(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (now - next[key].lastSeen > 15000) {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 3000);
    return () => clearInterval(checkInterval);
  }, []);

  // Cập nhật danh sách các Trọng tài / Máy quay đang hoạt động báo về component cha
  useEffect(() => {
    const list: BroadcasterInfo[] = Object.keys(broadcasterFrames).map(id => ({
      id,
      name: broadcasterFrames[id].name
    }));
    setActiveBroadcasterList(list);
    if (onBroadcastersFound) {
      onBroadcastersFound(list);
    }
  }, [Object.keys(broadcasterFrames).join(",")]);

  // Xác định khung hình cần hiển thị
  const activeKeys = Object.keys(broadcasterFrames);
  const currentKey = (selectedBroadcasterId && broadcasterFrames[selectedBroadcasterId]) 
    ? selectedBroadcasterId 
    : activeKeys[activeKeys.length - 1];

  const currentBroadcaster = currentKey ? broadcasterFrames[currentKey] : null;

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {currentBroadcaster ? (
        <img
          src={currentBroadcaster.image}
          alt={`Live Stream - ${currentBroadcaster.name}`}
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

      {/* Badge Trạng thái phát trực tiếp */}
      {currentBroadcaster && (
        <div className="absolute top-4 left-4 bg-rose-600/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-2 backdrop-blur-md shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>WEBCAM LIVE: {currentBroadcaster.name}</span>
        </div>
      )}
    </div>
  );
}
