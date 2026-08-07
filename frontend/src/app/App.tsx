import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/ui/PageTransition";

import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyLogin from "./components/auth/VerifyLogin";
import VerifyRegister from "./components/auth/VerifyRegister";
import VerifyForgot from "./components/auth/VerifyForgot";

import Landing from "./components/landing/Landing";
import Chatbot from "./components/landing/Chatbot";
import Livestream from "./components/landing/Livestream";

import Admin from "./components/dashboards/Admin";
import HorseOwner from "./components/dashboards/HorseOwner";
import Jockey from "./components/dashboards/Jockey";
import Referee from "./components/dashboards/Referee";
import Spectator from "./components/dashboards/Spectator";

function dashboardPathForRole(roleId: number): string {
  switch (roleId) {
    case 1: return "/dashboard/admin";
    case 2: return "/dashboard/owner";
    case 3: return "/dashboard/jockey";
    case 4: return "/dashboard/spectator";
    case 5: return "/dashboard/referee"; // Referee has no wallet tab; still land on dashboard
    default: return "/login";
  }
}

function walletReturnPath(roleId: number, payos: string): string {
  if (roleId === 5) return `/dashboard/referee?payos=${payos}`;
  return `${dashboardPathForRole(roleId)}?tab=wallet&payos=${payos}`;
}

/**
 * PayOS redirects back to returnUrl with ?code=00&status=PAID&orderCode=...
 * App previously ignored these params — this handler routes user to wallet and shows result.
 * Wallet credit itself still comes from PayOS webhook; this only handles the browser return.
 */
function PayOSReturnHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const status = (searchParams.get("status") || "").toUpperCase();
    const code = searchParams.get("code");
    const cancel = searchParams.get("cancel");
    const orderCode = searchParams.get("orderCode");

    const isPayOSReturn =
      orderCode != null ||
      status === "PAID" ||
      status === "CANCELLED" ||
      status === "PENDING" ||
      code === "00" ||
      cancel === "true" ||
      cancel === "false";

    if (!isPayOSReturn) return;

    const paid = status === "PAID" || (code === "00" && cancel !== "true");
    const cancelled = cancel === "true" || status === "CANCELLED";

    if (paid) {
      sessionStorage.setItem(
        "payos_return",
        JSON.stringify({ status: "PAID", orderCode, at: Date.now() })
      );
    } else if (cancelled) {
      sessionStorage.setItem(
        "payos_return",
        JSON.stringify({ status: "CANCELLED", orderCode, at: Date.now() })
      );
    }

    const payos = paid ? "success" : cancelled ? "cancelled" : "pending";
    const pendingPurpose = (sessionStorage.getItem("payos_pending_purpose") || "").toUpperCase();
    const savedPath = sessionStorage.getItem("payos_return_path");
    sessionStorage.removeItem("payos_pending_purpose");
    sessionStorage.removeItem("payos_return_path");

    let target: string;
    if (pendingPurpose === "PPV" || location.pathname.startsWith("/livestream")) {
      let base = savedPath && savedPath.startsWith("/") ? savedPath.split("?")[0] : "/livestream";
      // Spectator package checkout usually happens on dashboard live tab
      if (base.includes("/dashboard/spectator")) {
        target = `${base}?tab=live&payos=${payos}`;
      } else {
        target = `${base}?payos=${payos}`;
      }
    } else if (user) {
      target = walletReturnPath(user.roleId, payos);
    } else {
      target = `/login?payos=${payos}`;
    }

    navigate(target, { replace: true });
  }, [searchParams, navigate, user, location.pathname]);

  return null;
}

/**
 */
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

/**
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <PayOSReturnHandler />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
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

          {/* === Role-based dashboards (Role-based Dashboard access by Role ID) ===
              roleId: 1 = Admin, 2 = Owner (Horse Owner), 3 = Jockey (Jockey), 4 = Spectator (Spectator), 5 = Referee (Referee) */}
          
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
    </>
  );
}

/**
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
