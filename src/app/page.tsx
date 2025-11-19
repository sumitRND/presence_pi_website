"use client";

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        window.location.href =
          process.env.NEXT_PUBLIC_PI_WEBSITE_URL || "http://localhost:3001";
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="loading-screen">
      <div className="loading-spinner">Authenticating...</div>
    </div>
  );
}
