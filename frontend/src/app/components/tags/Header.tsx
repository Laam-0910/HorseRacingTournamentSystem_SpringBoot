import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-[#151310]/80 border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
        <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-500 text-black font-bold font-serif text-lg shadow-lg">
          🏇
        </div>
        <span className="font-black text-sm tracking-widest text-white">HORSERACING</span>
      </div>

      <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-white/60">
        <button onClick={() => navigate("/")} className="hover:text-white transition">Fixtures</button>
        <button onClick={() => navigate("/")} className="hover:text-white transition">Live Streaming</button>
        <button onClick={() => navigate("/chatbot")} className="hover:text-white transition">AI Assistant</button>
      </nav>

      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            <span className="text-xs text-white/80">Hello, <strong className="text-white">{user.username}</strong></span>
            <button
              onClick={() => {
                if (user.roleId === 1) navigate("/dashboard/admin");
                else if (user.roleId === 2) navigate("/dashboard/owner");
                else if (user.roleId === 3) navigate("/dashboard/jockey");
                else if (user.roleId === 5) navigate("/dashboard/referee");
                else navigate("/dashboard/spectator");
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-x-2">
            <button onClick={() => navigate("/login")} className="text-xs font-bold text-white/80 hover:text-white px-3 py-1.5">
              Sign In
            </button>
            <button onClick={() => navigate("/register")} className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
