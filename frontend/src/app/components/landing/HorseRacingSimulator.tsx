import { useEffect, useRef, useState } from "react";

interface Horse {
  id: number;
  name: string;
  number: number;
  color: string;
  riderColor: string;
  progress: number; // 0 to 100%
  speed: number;
  rank: number;
  aiWinProb: number; // AI Win Probability Percentage (e.g. 38%)
  finishTime?: number;
}

interface HorseRacingSimulatorProps {
  selectedRace?: any | null;
  entries?: any[];
}

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899"];
const RIDER_COLORS = ["#fef08a", "#000000", "#ffffff", "#f97316", "#ec4899", "#06b6d4"];

const DEFAULT_HORSES: Horse[] = [
  { id: 1, name: "Thunder King", number: 1, color: "#ef4444", riderColor: "#fef08a", progress: 0, speed: 0.18, rank: 1, aiWinProb: 38 },
  { id: 2, name: "Golden Pegasus", number: 2, color: "#f59e0b", riderColor: "#000000", progress: 0, speed: 0.16, rank: 2, aiWinProb: 26 },
  { id: 3, name: "Silver Comet", number: 3, color: "#3b82f6", riderColor: "#ffffff", progress: 0, speed: 0.15, rank: 3, aiWinProb: 18 },
  { id: 4, name: "Shadow Runner", number: 4, color: "#8b5cf6", riderColor: "#f97316", progress: 0, speed: 0.13, rank: 4, aiWinProb: 12 },
  { id: 5, name: "Emerald Warrior", number: 5, color: "#10b981", riderColor: "#ec4899", progress: 0, speed: 0.11, rank: 5, aiWinProb: 6 },
];

export default function HorseRacingSimulator({ selectedRace, entries }: HorseRacingSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [horses, setHorses] = useState<Horse[]>(DEFAULT_HORSES);
  const [isRunning, setIsRunning] = useState(true);
  const [commentary, setCommentary] = useState("AI Model calculating race trajectory probabilities...");
  const [winner, setWinner] = useState<Horse | null>(null);

  const horsesRef = useRef<Horse[]>(DEFAULT_HORSES);
  const animStepRef = useRef<number>(0);
  const frameRef = useRef<number>(0);

  // Compute JS AI Model Win Probabilities based on Class Race entries
  useEffect(() => {
    if (entries && entries.length > 0) {
      const scores = entries.map((item, idx) => {
        const h = item.horse || {};
        const j = item.jockey || {};
        const e = item.entry || {};
        const rating = Number(h.currentRating || h.rating || 50);
        const winRate = Number(h.winRate || 20);
        const jockeyRating = Number(j.jockeyRating || j.rating || 60);
        const rawScore = (rating * 0.5) + (winRate * 0.3) + (jockeyRating * 0.2);
        return {
          id: h.id || e.id || idx + 1,
          name: h.name || `Horse #${idx + 1}`,
          number: e.gateNumber || idx + 1,
          color: COLORS[idx % COLORS.length],
          riderColor: RIDER_COLORS[idx % RIDER_COLORS.length],
          progress: 0,
          speed: 0.15,
          rank: idx + 1,
          rawScore,
        };
      });
      const totalScore = scores.reduce((sum, s) => sum + s.rawScore, 0) || 1;
      const initialized: Horse[] = scores.map(s => {
        const aiWinProb = Math.round((s.rawScore / totalScore) * 100);
        return {
          id: s.id,
          name: s.name,
          number: s.number,
          color: s.color,
          riderColor: s.riderColor,
          progress: 0,
          speed: 0.10 + (aiWinProb / 100) * 0.12 + Math.random() * 0.04,
          rank: s.number,
          aiWinProb,
        };
      }).sort((a, b) => b.aiWinProb - a.aiWinProb);

      horsesRef.current = initialized;
      setHorses(initialized);
      setWinner(null);
      setIsRunning(true);
      if (initialized[0]) {
        setCommentary(`AI Analysis for ${selectedRace?.classLevel || "Live Race"}: ${initialized[0].name} (${initialized[0].aiWinProb}% AI Odds) leading initial predictions!`);
      }
    }
  }, [selectedRace?.id, entries]);

  // Reset simulation based on AI odds
  const handleReset = () => {
    const baseList = (horsesRef.current && horsesRef.current.length > 0) ? horsesRef.current : DEFAULT_HORSES;
    const fresh = baseList.map(h => ({
      ...h,
      progress: 0,
      speed: 0.10 + (h.aiWinProb / 100) * 0.12 + Math.random() * 0.05,
      rank: h.number
    }));
    horsesRef.current = fresh;
    setHorses(fresh);
    setWinner(null);
    setIsRunning(true);
    setCommentary(`AI Model re-simulating race trajectory for ${selectedRace?.classLevel || "Class Race"} (${selectedRace?.meetingName || "Live Event"})...`);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastCommentaryTime = 0;

    const render = (time: number) => {
      animStepRef.current += 0.2;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background - Turf Field
      ctx.fillStyle = "#0c1f12";
      ctx.fillRect(0, 0, width, height);

      // Track Lanes
      const numLanes = horsesRef.current.length || 5;
      const trackTop = 50;
      const trackBottom = height - 40;
      const laneHeight = (trackBottom - trackTop) / numLanes;

      // Draw Turf Grass Texture & Lanes
      for (let i = 0; i < numLanes; i++) {
        const laneY = trackTop + i * laneHeight;
        ctx.fillStyle = i % 2 === 0 ? "#14381e" : "#112e19";
        ctx.fillRect(0, laneY, width, laneHeight);

        // Lane separator lines
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(width, laneY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Finish Line
      const finishX = width - 80;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(finishX, trackTop, 6, trackBottom - trackTop);
      ctx.fillStyle = "#000000";
      for (let y = trackTop; y < trackBottom; y += 12) {
        if (Math.floor(y / 12) % 2 === 0) {
          ctx.fillRect(finishX, y, 6, 6);
        } else {
          ctx.fillRect(finishX + 6, y, 6, 6);
        }
      }

      // Finish Line Banner Text
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 10px monospace";
      ctx.fillText("FINISH", finishX - 10, trackTop - 10);

      // Starting Gate Line
      const startX = 60;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, trackTop);
      ctx.lineTo(startX, trackBottom);
      ctx.stroke();

      // 2. Update & Draw Horses
      let raceFinishedCount = 0;
      const updatedHorses = horsesRef.current.map((horse) => {
        let newProgress = horse.progress;

        if (isRunning && newProgress < 100) {
          // Dynamic acceleration influenced by AI Win Probability rating + micro-variance
          const aiBias = (horse.aiWinProb / 100) * 0.02;
          const speedVar = (Math.random() - 0.47 + aiBias) * 0.04;
          const currentSpeed = Math.max(0.08, Math.min(0.29, horse.speed + speedVar));
          newProgress = Math.min(100, horse.progress + currentSpeed);
          horse.speed = currentSpeed;
        }

        if (newProgress >= 100) raceFinishedCount++;

        return { ...horse, progress: newProgress };
      });

      // Calculate Rankings based on progress
      const sorted = [...updatedHorses].sort((a, b) => b.progress - a.progress);
      sorted.forEach((h, rIdx) => {
        const found = updatedHorses.find(item => item.id === h.id);
        if (found) found.rank = rIdx + 1;
      });

      horsesRef.current = updatedHorses;

      // Update state for Leaderboard every few frames
      if (Math.floor(animStepRef.current) % 5 === 0) {
        setHorses([...updatedHorses]);
      }

      // Commentary Updates based on AI analysis
      if (time - lastCommentaryTime > 3500 && isRunning) {
        lastCommentaryTime = time;
        const leader = sorted[0];
        const second = sorted[1];

        if (leader.progress >= 100) {
          setCommentary(`🏆 AI PREDICTION CONFIRMED! #${leader.number} (${leader.name} - ${leader.aiWinProb}% AI Odds) wins the race!`);
        } else if (leader.progress > 75) {
          setCommentary(`🔥 FINAL STRETCH! #${leader.number} (${leader.name}) leads home straight as predicted by AI statistical model!`);
        } else if (leader.progress > 40) {
          setCommentary(`⚡ AI Statistical Surge: #${leader.number} (${leader.name}) pushes ahead of #${second.number} (${second.name})!`);
        } else {
          setCommentary(`🤖 AI Live Model: #${leader.number} (${leader.name}) holding top pace ahead of lane ${second.id}!`);
        }
      }

      // Check for Winner
      if (raceFinishedCount === numLanes && isRunning) {
        setIsRunning(false);
        setWinner(sorted[0]);
      }

      // Draw Each Horse
      updatedHorses.forEach((horse, idx) => {
        const laneY = trackTop + idx * laneHeight + laneHeight / 2;
        const currentX = startX + (horse.progress / 100) * (finishX - startX);

        // Draw Dust Particles behind running horse
        if (isRunning && horse.progress < 100) {
          for (let p = 0; p < 3; p++) {
            ctx.fillStyle = `rgba(200, 160, 100, ${Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.arc(
              currentX - 15 - Math.random() * 15,
              laneY + 6 + (Math.random() - 0.5) * 6,
              1.5 + Math.random() * 2,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }

        // Draw Horse Body (2D Vector Art)
        ctx.save();
        ctx.translate(currentX, laneY);

        // Gallop leg animation bounce offset
        const legPhase = Math.sin(animStepRef.current * 1.5 + idx);
        const bounceY = isRunning && horse.progress < 100 ? Math.abs(legPhase) * 3 : 0;
        ctx.translate(0, -bounceY);

        // Horse Body Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(0, 12, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horse Legs
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Front legs
        ctx.moveTo(6, 4);
        ctx.lineTo(10 + legPhase * 6, 12);
        ctx.moveTo(3, 4);
        ctx.lineTo(6 - legPhase * 6, 12);
        // Back legs
        ctx.moveTo(-6, 4);
        ctx.lineTo(-10 - legPhase * 6, 12);
        ctx.moveTo(-9, 4);
        ctx.lineTo(-5 + legPhase * 6, 12);
        ctx.stroke();

        // Horse Main Body
        ctx.fillStyle = horse.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Horse Neck & Head
        ctx.beginPath();
        ctx.moveTo(8, -2);
        ctx.lineTo(14, -10);
        ctx.lineTo(18, -8);
        ctx.lineTo(14, 2);
        ctx.closePath();
        ctx.fill();

        // Rider / Jockey
        ctx.fillStyle = horse.riderColor;
        ctx.beginPath();
        ctx.arc(3, -11, 4, 0, Math.PI * 2); // Jockey Head
        ctx.fill();

        ctx.fillStyle = horse.color;
        ctx.beginPath();
        ctx.fillRect(-2, -7, 8, 7); // Jockey Torso

        // Horse Number Badge on Saddle
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-2, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(horse.number), -2, 0.5);

        ctx.restore();
      });

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning]);

  return (
    <div className="bg-[#101913] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
      {/* Simulation Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-2 uppercase tracking-wide">
              <span>🤖</span> AI Race Performance & Win Probability Simulation
            </h4>
            <p className="text-[10px] text-white/60 font-mono">
              Calculated based on AI Statistical Analytics & Historical Performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(prev => !prev)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono transition cursor-pointer border border-white/10"
          >
            {isRunning ? "⏸️ Pause Model" : "▶️ Run Model"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono font-bold transition cursor-pointer border border-emerald-500/30"
          >
            🔄 Recalculate AI Sim
          </button>
        </div>
      </div>

      {/* Dynamic AI Commentary Ticker */}
      <div className="bg-black/60 border border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center gap-3">
        <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider shrink-0">
          🤖 AI PREDICTIVE COMMENTARY:
        </span>
        <span className="text-xs font-mono text-white/90 truncate animate-pulse">
          {commentary}
        </span>
      </div>

      {/* HTML5 Canvas Simulation Screen */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-auto block"
        />

        {/* Winner Overlay Banner */}
        {winner && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-4xl mb-2">🏆</span>
            <h3 className="text-xl font-bold text-amber-400 font-serif">
              AI RACE TRAJECTORY SIMULATION COMPLETE!
            </h3>
            <p className="text-sm text-white font-mono mt-1">
              AI Predicted Winner: <span className="font-bold text-emerald-400">#{winner.number} {winner.name}</span> ({winner.aiWinProb}% AI Win Odds)
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              🔄 Re-Run AI Probability Trajectory
            </button>
          </div>
        )}
      </div>

      {/* AI Win Probability Leaderboard */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${horses.length || 5}, minmax(0, 1fr))`,
          gap: "0.5rem",
          paddingTop: "0.25rem"
        }}
      >
        {[...horses]
          .sort((a, b) => b.progress - a.progress)
          .map((h, i) => (
            <div
              key={h.id}
              className={`p-2 rounded-xl border text-center transition ${
                i === 0
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold"
                  : "bg-white/[0.02] border-white/10 text-white/70"
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span className="truncate">{h.name}</span>
              </div>
              <div className="text-[9px] font-mono text-emerald-400 mt-0.5">
                🤖 AI Odds: {h.aiWinProb}%
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(100, h.progress)}%`, backgroundColor: h.color }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
