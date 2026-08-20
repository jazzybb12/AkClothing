"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  permissions: string[];
}

interface UpdateProfileInput {
  currentPassword: string;
  name?: string;
  email?: string;
  newPassword?: string;
}

interface AdminAuthValue {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);
const TOKEN_KEY = "admin-access-token";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    apiFetch<AdminUser>("/auth/me", { token: stored })
      .then((u) => {
        setToken(stored);
        setUser(u);
      })
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await apiFetch<{ accessToken: string; user: AdminUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.user.role !== "ADMIN" && result.user.role !== "STAFF") {
      throw new ApiError(403, "This account does not have admin access");
    }
    window.localStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function updateProfile(input: UpdateProfileInput) {
    if (!token) return;
    const updated = await apiFetch<AdminUser>("/auth/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(input),
    });
    setUser(updated);
  }

  return (
    <AdminAuthContext.Provider value={{ user, token, loading, login, logout, updateProfile }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
