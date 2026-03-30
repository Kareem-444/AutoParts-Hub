"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    is_seller: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const user = await register(formData as any);
      router.push(user.is_seller ? "/seller" : "/");
    } catch (err: any) {
      // Parse DRF multiple errors if possible
      let errorMsg = err.message || "Registration failed";
      try {
        const parsed = JSON.parse(err.message);
        const msgs = Object.values(parsed).flat();
        if (msgs.length > 0) errorMsg = (msgs as string[]).join(", ");
      } catch (e) {}
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text">Create an account</h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Read to buy or sell car parts?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary-dark">
            Sign in instead
          </Link>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-text">Username</label>
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
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-text">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-light focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
                  />
                </div>
              </div>

              <div className="col-span-2">
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

              <div className="col-span-2">
                <label className="block text-sm font-medium text-text">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-border rounded-lg shadow-sm placeholder-text-light focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
                  />
                </div>
                <p className="mt-1 text-xs text-text-light">Must be at least 8 characters.</p>
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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-text-muted">
                  {typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "─────── أو ───────" : "─────── or ───────"}
                </span>
              </div>
            </div>
            
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}
