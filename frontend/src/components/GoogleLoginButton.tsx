"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setAuthFromGoogle } = useAuth();
  
  const authT = useTranslations("auth");

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/auth/google/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Google login failed");
        }

        if (data.status === "profile_incomplete") {
          // Store temp token
          sessionStorage.setItem("google_temp_token", data.temp_token);
          sessionStorage.setItem("google_email", data.email);
          sessionStorage.setItem("google_name", data.name || "");
          router.push("/auth/complete-profile");
        } else {
          // Complete login
          setAuthFromGoogle(data);
          router.push("/");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google compilation failed"),
  });

  return (
    <div className="flex flex-col items-center w-full mt-4">
      {error && <p className="text-error text-sm mb-2">{error}</p>}
      
      <button
        type="button"
        onClick={() => login()}
        disabled={loading}
        className="w-full flex items-center justify-center py-2.5 px-4 border border-border shadow-sm rounded-lg bg-surface hover:bg-background-alt text-text font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
        ) : (
          <svg className="w-5 h-5 mr-3 rtl:mr-0 rtl:ml-3" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        )}
        {loading ? (authT("loading") || "Loading...") : (authT("continue_with_google") || "Continue with Google")}
      </button>
    </div>
  );
}
