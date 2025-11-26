"use client";

import { useAuth } from "../hooks/useAuth";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="mb-8">
      <div className="neo-card p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          {/* You could add a logo here if available */}
          <div>
            <h1 className="text-2xl font-extrabold text-black uppercase tracking-tight">PI Dashboard</h1>
            <p className="text-sm text-gray-600 font-mono">Attendance Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="text-right hidden md:block">
            <p className="text-xs text-gray-500 uppercase font-bold">Logged in as</p>
            <p className="font-bold text-black">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="neo-btn neo-btn-danger"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}