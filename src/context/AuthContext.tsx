// ── AuthContext ───────────────────────────────────────────────────────────────
// Owns: session state, login/logout, password reset

import {
  createContext, useState, useContext, useEffect,
  useCallback, ReactNode,
} from "react";
import {
  dbLogin, dbLogout, dbCurrentUser, dbUpdatePassword,
} from "../lib/db";
import type { User } from "../types";

export interface AuthContextType {
  currentUser:     User | null;
  sessionReady:    boolean;
  mustSetPassword: boolean;
  isAdmin:         boolean;
  canManage:       boolean;
  canSuppliers:    boolean;
  setCurrentUser:  React.Dispatch<React.SetStateAction<User | null>>;
  setMustSetPassword: React.Dispatch<React.SetStateAction<boolean>>;
  login:                (email: string, password: string) => Promise<string | null>;
  logout:               () => void;
  completePasswordReset:(newPassword: string, oldPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) => {
  const [currentUser,     setCurrentUser]     = useState<User | null>(null);
  const [sessionReady,    setSessionReady]    = useState(false);
  const [mustSetPassword, setMustSetPassword] = useState(false);

  // Rehydrate session on mount
  useEffect(() => {
    const user = dbCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.mustChangePassword) setMustSetPassword(true);
    }
    setSessionReady(true);
  }, []);

  const isAdmin      = currentUser?.role === "admin";
  const canManage    = currentUser?.role !== "shopfloor";
  const canSuppliers = currentUser?.role === "admin" || currentUser?.role === "manager";

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const user = await dbLogin(email, password);
      setCurrentUser(user);
      if (user.mustChangePassword) setMustSetPassword(true);
      return null;
    } catch {
      return "Invalid email or password";
    }
  }, []);

  const logout = useCallback(() => {
    dbLogout();
    setCurrentUser(null);
    setMustSetPassword(false);
    onLogout(); // tell DataContext to clear its state
  }, [onLogout]);

  const completePasswordReset = useCallback(async (newPassword: string, oldPassword: string) => {
    if (!currentUser) return;
    await dbUpdatePassword(currentUser.id, newPassword, oldPassword);
    setCurrentUser({ ...currentUser, mustChangePassword: false });
    setMustSetPassword(false);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser, sessionReady, mustSetPassword,
      isAdmin, canManage, canSuppliers,
      setCurrentUser, setMustSetPassword,
      login, logout, completePasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
