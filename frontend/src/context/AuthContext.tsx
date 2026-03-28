"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "@/types";
import { setAccessTokenGetter } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Expose the access token to the api module via a getter
  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  // On mount, attempt a silent refresh to restore the session
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.access);
      setUser(data.user);
      return data.access;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    silentRefresh().finally(() => setLoading(false));
  }, [silentRefresh]);

  // Schedule token refresh before it expires (every 13 minutes)
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      silentRefresh();
    }, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken, silentRefresh]);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(err.error || err.detail || "Invalid credentials");
    }

    const data = await res.json();
    setAccessToken(data.access);
    setUser(data.user);
  };

  const register = async (formData: Record<string, unknown>): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Registration failed" }));
      throw new Error(err.detail || JSON.stringify(err));
    }

    const data = await res.json();
    setAccessToken(data.access);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    }
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!accessToken,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
