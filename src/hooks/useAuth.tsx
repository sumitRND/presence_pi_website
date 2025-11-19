"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  logout: () => void;
  isLoading: boolean;
  setSSOUser: (ssoUser: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 60 * 60 * 1000;
const SESSION_WARNING_TIME = 5 * 60 * 1000;

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const logout = useCallback(() => {
    console.log("AuthProvider: Logging out");
    setUser(null);
    localStorage.removeItem("sso_user");
    localStorage.removeItem("session_start");
    deleteCookie("sso_token");
    window.location.href = process.env.NEXT_PUBLIC_PI_WEBSITE_URL || "/";
  }, []);

  const checkSessionExpiry = useCallback(() => {
    const sessionStart = localStorage.getItem("session_start");
    if (!sessionStart) return;

    const startTime = parseInt(sessionStart);
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;

    if (
      elapsed >= SESSION_TIMEOUT - SESSION_WARNING_TIME &&
      elapsed < SESSION_TIMEOUT
    ) {
      if (!showWarning) {
        setShowWarning(true);
        const remainingMinutes = Math.ceil((SESSION_TIMEOUT - elapsed) / 60000);
        alert(
          `Your session will expire in ${remainingMinutes} minute(s). Please save your work.`,
        );
      }
    }

    if (elapsed >= SESSION_TIMEOUT) {
      alert("Your session has expired. You will be logged out.");
      logout();
    }
  }, [logout, showWarning]);

  useEffect(() => {
    console.log("AuthProvider: Checking for stored user...");

    const ssoUser = localStorage.getItem("sso_user");
    if (ssoUser) {
      try {
        const userData = JSON.parse(ssoUser);
        console.log("AuthProvider: Found SSO user:", userData);
        setUser(userData);

        const sessionStart = localStorage.getItem("session_start");
        if (!sessionStart) {
          localStorage.setItem("session_start", Date.now().toString());
        }
      } catch (error) {
        console.error("AuthProvider: Error parsing SSO user:", error);
        localStorage.removeItem("sso_user");
        localStorage.removeItem("session_start");
      }
    } else {
      console.log("AuthProvider: No SSO user found");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    checkSessionExpiry();

    const interval = setInterval(checkSessionExpiry, 60000);

    return () => clearInterval(interval);
  }, [user, checkSessionExpiry]);

  const setSSOUser = (ssoUser: AuthUser) => {
    console.log("AuthProvider: Setting SSO user:", ssoUser);
    setUser(ssoUser);
    localStorage.setItem("sso_user", JSON.stringify(ssoUser));
    localStorage.setItem("session_start", Date.now().toString());
    setCookie("sso_token", ssoUser.token);
    setShowWarning(false);
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading, setSSOUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
