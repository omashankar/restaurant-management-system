"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const { showToast } = useCustomer();
  const { link } = useRestaurantSlug();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast("All fields are required.", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setForm({ name: "", email: "", message: "" });
    setSent(true);
    showToast("Message sent! We'll get back to you soon.");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-zinc-200 bg-white/85 p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">Contact Us</h1>
        <p className="mt-2 text-sm text-zinc-600">Have a question or feedback? We&apos;d love to hear from you.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-xs font-medium text-zinc-600">Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500/40" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Message</label>
            <textarea rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Your message…" className="mt-1 w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500/40" />
          </div>
          <button type="submit" disabled={loading} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50">
            {loading ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : "Send Message"}
          </button>
          {sent && (
            <Link
              href={link("/home")}
              className="cursor-pointer flex w-full items-center justify-center rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
            >
              ← Back to Home
            </Link>
          )}
        </form>

        {/* Info */}
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Address",  value: "123 Restaurant Street, Food City, FC 10001" },
            { icon: Phone,  label: "Phone",    value: "+1 (555) 123-4567" },
            { icon: Mail,   label: "Email",    value: "hello@rmsrestaurant.com" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
                <p className="mt-0.5 text-sm text-zinc-700">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
