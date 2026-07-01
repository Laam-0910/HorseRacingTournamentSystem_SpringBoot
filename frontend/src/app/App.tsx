import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";

// ===== Auth =====
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyLogin from "./components/auth/VerifyLogin";
import VerifyRegister from "./components/auth/VerifyRegister";
import VerifyForgot from "./components/auth/VerifyForgot";

// ===== Landing =====
import Landing from "./components/landing/Landing";
import Chatbot from "./components/landing/Chatbot";

// ===== Dashboards =====
import Admin from "./components/dashboards/Admin";
import HorseOwner from "./components/dashboards/HorseOwner";
import Jockey from "./components/dashboards/Jockey";
import Referee from "./components/dashboards/Referee";
import Spectator from "./components/dashboards/Spectator";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: number[];
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.roleId)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-login" element={<VerifyLogin />} />
          <Route path="/verify-register" element={<VerifyRegister />} />
          <Route path="/verify-forgot" element={<VerifyForgot />} />

          {/* Role-based dashboards (roleId: 1=Admin, 2=Owner, 3=Jockey, 4=Spectator, 5=Referee) */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={[1]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/owner"
            element={
              <ProtectedRoute allowedRoles={[2]}>
                <HorseOwner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jockey"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <Jockey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/spectator"
            element={
              <ProtectedRoute allowedRoles={[4]}>
                <Spectator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/referee"
            element={
              <ProtectedRoute allowedRoles={[5]}>
                <Referee />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
