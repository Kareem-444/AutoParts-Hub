"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setAuthFromGoogle } = useAuth();
  
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  const handleSuccess = async (response: any) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: response.credential }),
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
  };

  return (
    <div className="flex flex-col items-center w-full mt-4">
      {error && <p className="text-error text-sm mb-2">{error}</p>}
      {loading ? (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center py-2 px-4 border border-border shadow-sm rounded-lg bg-surface text-text font-medium"
        >
          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
          {isRtl ? "جاري التحميل..." : "Loading..."}
        </button>
      ) : (
        <div className="w-full flex justify-center [&>div]:w-full [&_iframe]:w-full">
           <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Google compilation failed")}
              useOneTap={false}
              width="100%"
              theme="outline"
              size="large"
              text="continue_with"
              {...({ locale: isRtl ? 'ar' : 'en' } as any)}
           />
        </div>
      )}
    </div>
  );
}
