"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
  phone: string | null;
}

interface CustomerAuthValue {
  user: CustomerUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);
const TOKEN_KEY = "customer-access-token";

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    apiFetch<CustomerUser>("/auth/me", { token: stored })
      .then((u) => {
        setToken(stored);
        setUser(u);
      })
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await apiFetch<{ accessToken: string; user: CustomerUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    window.localStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const result = await apiFetch<{ accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
    window.localStorage.setItem(TOKEN_KEY, result.accessToken);
    const me = await apiFetch<CustomerUser>("/auth/me", { token: result.accessToken });
    setToken(result.accessToken);
    setUser(me);
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <CustomerAuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  return ctx;
}
