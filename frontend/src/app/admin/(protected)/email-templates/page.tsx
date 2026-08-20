"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/lib/AdminAuthContext";

type TemplateKey = "ORDER_CONFIRMATION" | "STATUS_CONFIRMED" | "STATUS_SHIPPED" | "STATUS_DELIVERED" | "STATUS_CANCELLED";

interface Template {
  key: TemplateKey;
  subject: string;
  body: string;
  isCustomized: boolean;
}

const LABELS: Record<TemplateKey, string> = {
  ORDER_CONFIRMATION: "Order Confirmation",
  STATUS_CONFIRMED: "Status: Confirmed",
  STATUS_SHIPPED: "Status: Shipped",
  STATUS_DELIVERED: "Status: Delivered",
  STATUS_CANCELLED: "Status: Cancelled",
};

function TemplateCard({
  template,
  onSave,
  onReset,
  placeholders,
}: {
  template: Template;
  onSave: (key: TemplateKey, subject: string, body: string) => Promise<void>;
  onReset: (key: TemplateKey) => Promise<void>;
  placeholders: string[];
}) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setSubject(template.subject);
    setBody(template.body);
  }, [template.subject, template.body]);

  const dirty = subject !== template.subject || body !== template.body;

  return (
    <div className="rang-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{LABELS[template.key]}</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            template.isCustomized
              ? "bg-brand/10 text-brand"
              : "bg-ink/10 text-ink-soft"
          }`}
        >
          {template.isCustomized ? "Customized" : "Default"}
        </span>
      </div>

      <label className="mb-1 block text-sm font-medium">Subject</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rang-input mb-3" />

      <label className="mb-1 block text-sm font-medium">Body (HTML)</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        className="rang-input font-mono text-xs"
      />

      <p className="mt-2 text-xs text-ink-soft">
        Available placeholders: {placeholders.map((p) => `{{${p}}}`).join(", ")}
      </p>

      <div className="mt-3 flex gap-3">
        <button
          onClick={async () => {
            setSaving(true);
            await onSave(template.key, subject, body);
            setSaving(false);
          }}
          disabled={!dirty || saving}
          className="rang-btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={async () => {
            setResetting(true);
            await onReset(template.key);
            setResetting(false);
          }}
          disabled={!template.isCustomized || resetting}
          className="rounded-lg border border-ink/25 px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-40"
        >
          {resetting ? "Resetting..." : "Reset to Default"}
        </button>
      </div>
    </div>
  );
}

export default function AdminEmailTemplatesPage() {
  const { token } = useAdminAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ templates: Template[]; placeholders: string[] }>("/admin/email-templates", { token });
      setTemplates(res.templates);
      setPlaceholders(res.placeholders);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load email templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSave(key: TemplateKey, subject: string, body: string) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/email-templates/${key}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ subject, body }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this template");
    }
  }

  async function handleReset(key: TemplateKey) {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/admin/email-templates/${key}/reset`, { method: "POST", token });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset this template");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Emails</h1>
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {templates.map((t) => (
            <TemplateCard key={t.key} template={t} onSave={handleSave} onReset={handleReset} placeholders={placeholders} />
          ))}
        </div>
      )}
    </div>
  );
}
