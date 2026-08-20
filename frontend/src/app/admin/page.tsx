"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/AdminAuthContext";

export default function AdminIndexPage() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/admin/dashboard" : "/admin/login");
  }, [loading, user, router]);

  return null;
}
