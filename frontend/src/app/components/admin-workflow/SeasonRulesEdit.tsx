import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";

interface SeasonRulesEditProps {
  seasonId: number;
  seasonName: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SeasonRulesEdit({ seasonId, seasonName, onClose, onSaved }: SeasonRulesEditProps) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get<any[]>(`/races/seasons/${seasonId}/rules`)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const sanitized = data.map((r: any) => ({
            ...r,
            minPrize: r.minPrize != null && r.minPrize < 10000000 ? r.minPrize * 1000 : r.minPrize,
            maxPrize: r.maxPrize != null && r.maxPrize < 10000000 ? r.maxPrize * 1000 : r.maxPrize,
          }));
          setRules(sanitized);
        } else {
          // Default template fallback if empty
          setRules([
            { classLevel: "Class 1", minRating: 95, maxRating: null, minPrize: 300000000, maxPrize: 1000000000 },
            { classLevel: "Class 2", minRating: 80, maxRating: 94, minPrize: 200000000, maxPrize: 299999000 },
            { classLevel: "Class 3", minRating: 60, maxRating: 79, minPrize: 100000000, maxPrize: 199999000 },
            { classLevel: "Class 4", minRating: 40, maxRating: 59, minPrize: 50000000, maxPrize: 99999000 },
            { classLevel: "Class 5", minRating: 0,  maxRating: 39, minPrize: 20000000, maxPrize: 49999000 },
          ]);
        }
      })
      .catch(err => setError(getErrMsg(err, "Failed to load season rules.")))
      .finally(() => setLoading(false));
  }, [seasonId]);

  const updateRule = (index: number, field: string, value: any) => {
    setRules(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value === "" ? null : Number(value)
      };
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/races/seasons/${seasonId}/rules`, rules);
      if (res.success !== false) {
        setSuccess("Season Class Rules updated successfully!");
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1000);
      } else {
        throw new Error(res.error || "Failed to update rules.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to save season rules."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60000, padding: "1rem" }}>
      <div style={{ background: "#12100d", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "1rem", width: "100%", maxWidth: "46rem", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(201,162,39,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#f4f2ec", fontFamily: "'Roboto Slab', serif" }}>
              Edit Season Class Rules - {seasonName}
            </h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
              Configure minimum & maximum rating thresholds and purse prize bounds for each class tier.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "12px" }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399", fontSize: "12px" }}>
              ✓ {success}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "12px" }}>
              Loading season class rules...
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "12px", fontFamily: "monospace", textTransform: "uppercase", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#c9a227" }}>
                    <th style={{ padding: "0.5rem" }}>Class Level</th>
                    <th style={{ padding: "0.5rem" }}>Min Rating</th>
                    <th style={{ padding: "0.5rem" }}>Max Rating</th>
                    <th style={{ padding: "0.5rem" }}>Min Purse (VND)</th>
                    <th style={{ padding: "0.5rem" }}>Max Purse (VND)</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.5rem", fontWeight: "bold", color: "#f4f2ec" }}>{rule.classLevel}</td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="number"
                          value={rule.minRating ?? ""}
                          onChange={e => updateRule(idx, "minRating", e.target.value)}
                          required
                          style={{ width: "70px", padding: "0.35rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "0.25rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="number"
                          value={rule.maxRating ?? ""}
                          onChange={e => updateRule(idx, "maxRating", e.target.value)}
                          placeholder="No limit"
                          style={{ width: "70px", padding: "0.35rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "0.25rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="number"
                          value={rule.minPrize ?? ""}
                          onChange={e => updateRule(idx, "minPrize", e.target.value)}
                          required
                          style={{ width: "110px", padding: "0.35rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#34d399", borderRadius: "0.25rem", outline: "none" }}
                        />
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="number"
                          value={rule.maxPrize ?? ""}
                          onChange={e => updateRule(idx, "maxPrize", e.target.value)}
                          required
                          style={{ width: "110px", padding: "0.35rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#34d399", borderRadius: "0.25rem", outline: "none" }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "0.625rem 1.25rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.5rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              style={{
                padding: "0.625rem 1.25rem",
                background: "#c9a227",
                color: "#0b0d11",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? "Saving Rules..." : "Save Class Rules"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
