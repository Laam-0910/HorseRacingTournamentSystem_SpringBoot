import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { parseSafeDate, formatDateTime } from "../../utils/dateTimeHelper";

interface InlineDatePickerProps {
  label: string;
  value: string; // format: dd-MM-yyyy
  onChange: (val: string) => void;
}

function InlineDatePicker({ label, value, onChange }: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  });

  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = value.match(datePattern);
  const selectedDay = match ? parseInt(match[1]) : null;
  const selectedMonth = match ? parseInt(match[2]) - 1 : null;
  const selectedYear = match ? parseInt(match[3]) : null;

  useEffect(() => {
    if (isOpen && selectedMonth !== null && selectedYear !== null) {
      setCurrentDate({ month: selectedMonth, year: selectedYear });
    }
  }, [isOpen, selectedMonth, selectedYear]);

  const daysInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
  let firstDay = new Date(currentDate.year, currentDate.month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handlePrevMonth = () => {
    setCurrentDate(prev =>
      prev.month === 0 ? { month: 11, year: prev.year - 1 } : { month: prev.month - 1, year: prev.year }
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(prev =>
      prev.month === 11 ? { month: 0, year: prev.year + 1 } : { month: prev.month + 1, year: prev.year }
    );
  };

  const handleSelectDay = (day: number) => {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(currentDate.month + 1).padStart(2, "0");
    onChange(`${formattedDay}-${formattedMonth}-${currentDate.year}`);
    setIsOpen(false);
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="relative">
      <label style={labelStyle}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          value={value}
          placeholder="dd-mm-yyyy"
          style={inputStyle}
          className="cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-amber-500 transition text-sm focus:outline-none"
        >
          📅
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-[110%] left-0 w-64 bg-[#100f0c] border border-[#2a2825] rounded-xl p-3.5 shadow-2xl z-50 space-y-3 select-none">
            <div className="flex items-center justify-between text-xs font-mono">
              <button type="button" onClick={handlePrevMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">◀</button>
              <div className="flex items-center gap-1">
                <select
                  value={currentDate.month}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold uppercase tracking-wider border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#100f0c] text-white">
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={currentDate.year}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 25 + i).map(yr => (
                    <option key={yr} value={yr} className="bg-[#100f0c] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleNextMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">▶</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-white/40 uppercase font-mono">
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map(b => <div key={`blank-${b}`} className="h-7 w-7"></div>)}
              {daysArray.map(day => {
                const isSelected = selectedDay === day && selectedMonth === currentDate.month && selectedYear === currentDate.year;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 text-[10px] font-mono rounded-lg flex items-center justify-center transition ${
                      isSelected ? "bg-amber-500 text-black font-bold" : "text-white/80 hover:bg-white/5 hover:text-amber-500"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Horses() {
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Edit Horse State
  const [editingHorse, setEditingHorse] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editRating, setEditRating] = useState<number>(52);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editSex, setEditSex] = useState("Gelding");
  const [editAvatar, setEditAvatar] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const allHorses = await api.get<any[]>("/public/horses");
      setHorses(allHorses);
    } catch (err: any) {
      setError(err.message || "Failed to load horse directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setError("Avatar image size must be less than 1.5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEdit = (h: any) => {
    setEditingHorse(h);
    setEditName(h.name || "");
    setEditBreed(h.breed || "");
    setEditSex(h.sex || "Gelding");
    setEditDob(h.dateOfBirth ? formatDateTime(h.dateOfBirth).split(" ")[0] : "");
    setEditRating(h.currentRating || 52);
    setEditStatus(h.status || "ACTIVE");
    setEditAvatar(h.avatar || "");
    setEditDescription(h.description || "");
  };

  const validateAgeAndSex = (dobStr: string, sexVal: string): boolean => {
    if (!dobStr || !sexVal) return true;
    const parts = dobStr.split("-");
    if (parts.length !== 3) return true;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age >= 4) {
      if (sexVal === "Colt") {
        alert("A Colt must be under 4 years old. For uncastrated male horses 4 years or older, please select 'Horse'.");
        return false;
      }
      if (sexVal === "Filly") {
        alert("A Filly must be under 4 years old. For female horses 4 years or older, please select 'Mare'.");
        return false;
      }
    } else {
      if (sexVal === "Horse") {
        alert("A Horse (uncastrated male) must be 4 years or older. For uncastrated male horses under 4 years, please select 'Colt'.");
        return false;
      }
      if (sexVal === "Mare") {
        alert("A Mare must be 4 years or older. For female horses under 4 years, please select 'Filly'.");
        return false;
      }
    }
    return true;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHorse) return;
    if (!validateAgeAndSex(editDob, editSex)) return;
    setError("");
    setSuccess("");
    try {
      const formattedDob = editDob ? `${editDob} 00:00:00` : "";
      const body = {
        name: editName,
        breed: editBreed,
        sex: editSex,
        dateOfBirth: formattedDob,
        currentRating: editRating,
        status: editStatus,
        avatar: editAvatar,
        description: editDescription
      };

      await api.put(`/horses/${editingHorse.id}`, body);
      showSuccess(`Horse "${editName}" updated successfully.`);
      setEditingHorse(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update horse.");
    }
  };

  const filteredHorses = horses.filter(h => {
    let matchesStatus = true;
    if (filterStatus !== "ALL") {
      matchesStatus = (h.status === filterStatus);
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (h.name || "").toLowerCase().includes(q);
      const breedMatch = (h.breed || "").toLowerCase().includes(q);
      const ownerIdMatch = String(h.ownerId || "").includes(q);
      matchesSearch = nameMatch || breedMatch || ownerIdMatch;
    }

    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Alert Banners */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-mono text-red-400">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-400">
          ✓ {success}
        </div>
      )}

      {/* Header and filters */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec" }}>Horse Registry Directory</h3>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>View, edit ratings, status, and information of all stable horses</p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search horse name or breed..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: "14rem" }}
          />

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ ...selectStyle, width: "8rem" }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="INJURED">Injured</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Horses Table */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Horse", "Breed", "Sex", "Current Rating", "Owner ID", "Status", "Races Run", "Actions"].map((h, idx) => (
                  <th key={idx} style={{ padding: "0.75rem 1.5rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 7 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading horses data...</td></tr>
              ) : filteredHorses.length > 0 ? (
                filteredHorses.map((h) => {
                  let statusColor = "#a0a0a0";
                  if (h.status === "ACTIVE") statusColor = "#4ade80";
                  else if (h.status === "PENDING") statusColor = "#fbbf24";
                  else if (h.status === "REJECTED" || h.status === "SUSPENDED") statusColor = "#f87171";

                  return (
                    <tr key={h.id} className="hover:bg-white/[0.015] transition-colors">
                      <td style={{ padding: "0.75rem 1.5rem", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {h.avatar ? (
                          <img src={h.avatar} alt={h.name} style={{ width: "2.25rem", height: "2.25rem", objectFit: "cover", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.1)" }} />
                        ) : (
                          <div style={{ width: "2.25rem", height: "2.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>🐴</div>
                        )}
                        <div>
                          <div>{h.name}</div>
                          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>ID: #{h.id}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.8)" }}>{h.breed}</td>
                      <td style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.8)" }}>{h.sex || "Gelding"}</td>
                      <td style={{ padding: "0.75rem 1.5rem", fontWeight: "bold", color: "#fbbf24" }}>{h.currentRating}</td>
                      <td style={{ padding: "0.75rem 1.5rem", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>Owner #{h.ownerId}</td>
                      <td style={{ padding: "0.75rem 1.5rem" }}>
                        <span style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: "bold", color: statusColor, background: `${statusColor}15`, padding: "0.15rem 0.45rem", borderRadius: "0.25rem", border: `1px solid ${statusColor}25` }}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.5)" }}>{h.totalRaces || 0} races</td>
                      <td style={{ padding: "0.75rem 1.5rem", textAlign: "right" }}>
                        <button onClick={() => handleOpenEdit(h)} style={{ padding: "0.375rem 0.75rem", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", color: "#c9a227", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>
                          Edit Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No registered horses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Horse Modal */}
      {editingHorse && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "36rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,162,39,0.1)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>Edit Horse Registry Details</h3>
              <button onClick={() => setEditingHorse(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Horse Name</label>
                  <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Breed</label>
                  <input type="text" required value={editBreed} onChange={e => setEditBreed(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Gender / Sex</label>
                  <select value={editSex} onChange={e => setEditSex(e.target.value)} style={selectStyle}>
                    <option value="Gelding">Gelding</option>
                    <option value="Colt">Colt</option>
                    <option value="Horse">Horse</option>
                    <option value="Filly">Filly</option>
                    <option value="Mare">Mare</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <InlineDatePicker label="Date of Birth" value={editDob} onChange={setEditDob} />
                <div>
                  <label style={labelStyle}>Current Rating</label>
                  <input type="number" required value={editRating} onChange={e => setEditRating(parseInt(e.target.value))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={selectStyle}>
                    <option value="PENDING">PENDING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INJURED">INJURED</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Horse Photo / Avatar</label>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: editAvatar ? "1fr 1fr" : "1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Biography / Description</label>
                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, height: "6.5rem", resize: "none" }} />
                </div>
                {editAvatar && (
                  <div>
                    <label style={labelStyle}>Photo Preview</label>
                    <img src={editAvatar} alt="Preview" style={{ width: "100%", height: "6.5rem", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(201,162,39,0.1)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingHorse(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "0.5rem",
  color: "rgba(255,255,255,0.4)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "#12141a",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};
