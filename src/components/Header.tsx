"use client";

import { useAuth } from "../hooks/useAuth";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b-2 border-black shadow-brutal">
      <div className="header-container">
        <h1 className="header-title">PI Dashboard</h1>
        <div className="header-user-info">
          <NotificationBell />
          <span>Welcome, {user?.username}</span>
          <button onClick={logout} className="header-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
