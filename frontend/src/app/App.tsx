import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/ui/PageTransition";

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
import Livestream from "./components/landing/Livestream";

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

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/chatbot" element={<PageTransition><Chatbot /></PageTransition>} />
        <Route
          path="/livestream"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
              <PageTransition><Livestream /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/livestream/:raceId"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
              <PageTransition><Livestream /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/verify-login" element={<PageTransition><VerifyLogin /></PageTransition>} />
        <Route path="/verify-register" element={<PageTransition><VerifyRegister /></PageTransition>} />
        <Route path="/verify-forgot" element={<PageTransition><VerifyForgot /></PageTransition>} />

        {/* Role-based dashboards (roleId: 1=Admin, 2=Owner, 3=Jockey, 4=Spectator, 5=Referee) */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <PageTransition><HorseOwner /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/jockey"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <PageTransition><Jockey /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/spectator"
          element={
            <ProtectedRoute allowedRoles={[4]}>
              <PageTransition><Spectator /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/referee"
          element={
            <ProtectedRoute allowedRoles={[5]}>
              <PageTransition><Referee /></PageTransition>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
