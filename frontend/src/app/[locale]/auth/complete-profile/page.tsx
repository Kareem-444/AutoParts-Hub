"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { setAuthFromGoogle } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    is_seller: false,
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tempToken, setTempToken] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load from sessionStorage
    const token = sessionStorage.getItem("google_temp_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setTempToken(token);
    setEmail(sessionStorage.getItem("google_email") || "");
    const googleName = sessionStorage.getItem("google_name") || "";
    setName(googleName);
    
    // Default username to email prefix if possible or name
    if (googleName) {
      setFormData(prev => ({ ...prev, username: googleName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() }));
    } else {
      const emailPrefix = (sessionStorage.getItem("google_email") || "").split("@")[0];
      setFormData(prev => ({ ...prev, username: emailPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() }));
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/complete_google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          temp_token: tempToken,
          username: formData.username,
          phone: formData.phone,
          is_seller: formData.is_seller,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete profile");
      }

      // Success
      sessionStorage.removeItem("google_temp_token");
      sessionStorage.removeItem("google_email");
      sessionStorage.removeItem("google_name");
      
      setAuthFromGoogle(data);
      router.push(formData.is_seller ? "/seller" : "/");
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) return null;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text">Almost there!</h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Complete your profile to finish signing in as <strong className="text-text">{email}</strong>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-border">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-error p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text">Username <span className="text-red-500">*</span></label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-light focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
                />
              </div>
              <p className="mt-1 text-xs text-text-light">This is how other users will see you.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text">Phone Number (Optional)</label>
              <div className="mt-1">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-light focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
                />
              </div>
            </div>

            <div className="flex items-start bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
              <div className="flex items-center h-5">
                <input
                  id="is_seller"
                  type="checkbox"
                  checked={formData.is_seller}
                  onChange={(e) => setFormData({ ...formData, is_seller: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_seller" className="font-medium text-primary-dark">I want to sell car parts</label>
                <p className="text-primary mt-0.5">Select this if you plan to open a store and list spare parts for sale on the marketplace.</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                  loading ? "bg-primary-light cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors`}
              >
                {loading ? "Completing..." : "Complete Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
