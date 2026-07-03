import { createContext, useContext, useState, ReactNode } from "react";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  roleId: number;
  status?: string;
  avatar?: string;
  fullName?: string;
  weight?: number;
  requireOtp?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const saved = sessionStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      sessionStorage.setItem("user", JSON.stringify(u));
    } else {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
