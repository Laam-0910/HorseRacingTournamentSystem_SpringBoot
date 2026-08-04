import React, { useState, useEffect, useRef } from "react";
import { $t } from "../../../lib/i18n";
import { getWebSocketUrl } from "../../../lib/api";

export interface BroadcasterInfo {
  id: string;
  name: string;
}

interface Props {
  raceId: number;
  selectedBroadcasterId?: string | null;
  onBroadcastersFound?: (list: BroadcasterInfo[]) => void;
}

interface FrameCache {
  image: string;
  name: string;
  lastSeen: number;
}

export default function WebCamLiveViewer({ raceId, selectedBroadcasterId, onBroadcastersFound }: Props) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasFrame, setHasFrame] = useState<boolean>(false);
  const [activeBroadcasterName, setActiveBroadcasterName] = useState<string>("");

  const imgRef = useRef<HTMLImageElement | null>(null);
  const framesCacheRef = useRef<Record<string, FrameCache>>({});
  const lastSeqRef = useRef<Record<string, number>>({});
  const selectedKeyRef = useRef<string | null>(selectedBroadcasterId || null);
  const lastKeysStrRef = useRef<string>("");

  const pendingFrameRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedKeyRef.current = selectedBroadcasterId || null;
  }, [selectedBroadcasterId]);

  // Zero-lag rAF rendering loop for synchronous DOM updating
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;

      if (pendingFrameRef.current) {
        pendingFrameRef.current = false;
        const activeKeys = Object.keys(framesCacheRef.current);
        const currentKey = (selectedKeyRef.current && framesCacheRef.current[selectedKeyRef.current])
          ? selectedKeyRef.current
          : activeKeys[activeKeys.length - 1];

        if (currentKey && framesCacheRef.current[currentKey]) {
          const entry = framesCacheRef.current[currentKey];
          if (imgRef.current && imgRef.current.src !== entry.image) {
            imgRef.current.src = entry.image;
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const wsUrl = getWebSocketUrl(`/ws/livestream/${raceId}`);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";

    const dec = new TextDecoder();

    ws.onopen = () => {
      console.log("Viewer Connected to WebCam Stream #" + raceId);
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "JOIN_VIEWER", raceId }));
    };

    ws.onmessage = (event) => {
      try {
        if (event.data instanceof ArrayBuffer) {
          // Binary frame: [2-byte meta length][4-byte frameSeq][meta bytes: "broadcasterId|broadcasterName"][dataUrl bytes]
          const view = new DataView(event.data);
          const metaLen = view.getUint16(0, true);
          const frameSeq = view.getUint32(2, true);

          const metaStr = dec.decode(new Uint8Array(event.data, 6, metaLen));
          const pipeIdx = metaStr.indexOf("|");
          const bId = pipeIdx !== -1 ? metaStr.substring(0, pipeIdx) : "default_broadcaster";
          const bName = pipeIdx !== -1 ? metaStr.substring(pipeIdx + 1) : "Referee Stream";

          const dataUrl = dec.decode(new Uint8Array(event.data, 6 + metaLen));

          // Drop out-of-order frames
          if (lastSeqRef.current[bId] && frameSeq <= lastSeqRef.current[bId] && (lastSeqRef.current[bId] - frameSeq < 4000000000)) {
            return;
          }
          lastSeqRef.current[bId] = frameSeq;

          framesCacheRef.current[bId] = {
            image: dataUrl,
            name: bName,
            lastSeen: Date.now()
          };

          pendingFrameRef.current = true;

          const activeKeys = Object.keys(framesCacheRef.current);
          const currentKey = (selectedKeyRef.current && framesCacheRef.current[selectedKeyRef.current])
            ? selectedKeyRef.current
            : activeKeys[activeKeys.length - 1];

          if (currentKey && framesCacheRef.current[currentKey]) {
            const currentObj = framesCacheRef.current[currentKey];
            setHasFrame(true);
            setActiveBroadcasterName(prev => prev !== currentObj.name ? currentObj.name : prev);
          }

          const newKeysStr = activeKeys.join(",");
          if (newKeysStr !== lastKeysStrRef.current) {
            lastKeysStrRef.current = newKeysStr;
            const list: BroadcasterInfo[] = activeKeys.map(id => ({ id, name: framesCacheRef.current[id].name }));
            if (onBroadcastersFound) onBroadcastersFound(list);
          }

        } else {
          // Text message fallback (STREAM_STOPPED, legacy JSON frames)
          const data = JSON.parse(event.data);
          if (data.type === "STREAM_STOPPED") {
            const stopId = data.broadcasterId || "default_broadcaster";
            delete framesCacheRef.current[stopId];
            delete lastSeqRef.current[stopId];
            if (Object.keys(framesCacheRef.current).length === 0) {
              setHasFrame(false);
            }
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "LEAVE_VIEWER", raceId }));
        ws.close();
      }
    };
  }, [raceId]);

  // Clean stale broadcasters (> 10 sec no frame)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const keys = Object.keys(framesCacheRef.current);
      let changed = false;
      keys.forEach(k => {
        if (now - framesCacheRef.current[k].lastSeen > 10000) {
          delete framesCacheRef.current[k];
          delete lastSeqRef.current[k];
          changed = true;
        }
      });
      if (changed && Object.keys(framesCacheRef.current).length === 0) {
        setHasFrame(false);
      }
    }, 3000);
    return () => clearInterval(checkInterval);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <img
        ref={imgRef}
        alt="Live Stream"
        className={`w-full h-full object-cover ${hasFrame ? "block" : "hidden"}`}
      />

      {!hasFrame && (
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-2" />
          <p className="text-amber-400 font-semibold text-sm">
            {$t("Waiting for live camera stream from referee...", localStorage.getItem("app-lang") || "en")}
          </p>
          <p className="text-white/40 text-xs font-mono">
            {isConnected ? "Connected to Zero-Latency WebSocket Stream. Waiting for frames..." : "Connecting to Stream Server..."}
          </p>
        </div>
      )}

      {hasFrame && (
        <div className="absolute top-4 left-4 bg-rose-600/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-2 backdrop-blur-md shadow-lg animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>WEBCAM LIVE: {activeBroadcasterName}</span>
        </div>
      )}
    </div>
  );
}
