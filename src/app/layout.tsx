import type { Metadata } from "next";
import { AuthProvider } from "../hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "PI Dashboard - Attendance Management",
  description: "PI Dashboard for managing project attendance",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
