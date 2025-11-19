"use client";

import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    console.log("Dashboard Layout - User:", user, "Loading:", isLoading);

    if (!isLoading && !user) {
      console.log("No user found, should redirect");
      setShouldRedirect(true);
      const timer = setTimeout(() => {
        router.push("/");
      }, 1000);

      return () => clearTimeout(timer);
    } else if (user) {
      console.log("User found, staying on dashboard");
      setShouldRedirect(false);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (shouldRedirect || !user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="main-content">
        <Header />
        {children}
      </div>
    </div>
  );
}
