// src/app/sso/page.tsx - CORRECTED VERSION

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Import useRouter
import { useAuth } from "../../hooks/useAuth";
import Link from "next/link";
import { DebugInfo } from "@/types";

export default function SSOPage() {
    const searchParams = useSearchParams();
    const router = useRouter(); // Initialize the router
    const { setSSOUser } = useAuth();
    const [error, setError] = useState("");
    const [debug, setDebug] = useState<DebugInfo | null>(null);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setError("No SSO token provided");
            return;
        }

        try {
            const decodedToken = atob(token);
            const ssoData = JSON.parse(decodedToken);

            if (
                !ssoData.username ||
                !ssoData.projectCodes ||
                !Array.isArray(ssoData.projectCodes)
            ) {
                throw new Error("Invalid SSO data structure");
            }

            const tokenAge = Date.now() - ssoData.timestamp;
            const maxAge = 5 * 60 * 1000;
            if (tokenAge > maxAge) {
                throw new Error("SSO token expired");
            }

            const authUser = {
                username: ssoData.username,
                projectCode: ssoData.projectCodes[0],
                projects: ssoData.projectCodes,
                token: `sso-${Date.now()}`,
                isSSO: true,
            };

            setDebug({ ssoData, authUser, tokenAge });
            setSSOUser(authUser);
            setRedirecting(true);

            // Redirect using Next.js router after a delay
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err) {
            setError(
                `Invalid SSO token: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
            setDebug({ error: err, token });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // <-- CRITICAL FIX: Use an empty dependency array

    // The rest of your component remains the same...
    if (error) {
        return (
            <div className="loading-screen">
                <div className="error-message">
                    <h2>SSO Authentication Failed</h2>
                    <p>{error}</p>
                    {debug && (
                        <div className="mt-5 text-left bg-gray-100 p-2.5 rounded">
                            <h3>Debug Info:</h3>
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(debug, null, 2)}
                            </pre>
                        </div>
                    )}
                    <br />
                    <Link href="/">Go to home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="loading-screen">
            <div className="loading-spinner">
                <p>
                    {redirecting
                        ? "Authentication successful! Redirecting to dashboard..."
                        : "Authenticating via SSO..."}
                </p>
                {debug && (
                    <div className="mt-5 text-left bg-gray-100 p-2.5 rounded max-w-xl">
                        <h3>Debug Info:</h3>
                        <p>
                            <strong>Username:</strong>{" "}
                            {debug.authUser?.username}
                        </p>
                        <p>
                            <strong>Projects:</strong>{" "}
                            {debug.authUser?.projects?.join(", ")}
                        </p>
                        <p>
                            <strong>Token Age:</strong> {debug.tokenAge}ms
                        </p>
                        {redirecting && (
                            <p className="text-green-600">
                                <strong>Status:</strong> Redirecting in 2
                                seconds...
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
