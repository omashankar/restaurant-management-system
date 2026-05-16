"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, MapPin, Phone, Send, CheckCircle2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const inputCls = "w-full rounded-xl border border-[#FFE4D6] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-all placeholder:text-[#6B7280] focus:border-[#FF6B35]/50 focus:ring-2 focus:ring-[#FF6B35]/10";

export default function ContactPage() {
  const { showToast } = useCustomer();
  const { link } = useRestaurantSlug();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
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
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setForm({ name: "", email: "", subject: "", message: "" });
    setSent(true);
    showToast("Message sent! We'll get back to you soon.");
  };

  const CONTACT_INFO = [
    { Icon: MapPin, label: "Address",  value: "123 Restaurant Street, Food City, FC 10001", color: "bg-[#FF6B35]/10 text-[#FF6B35]" },
    { Icon: Phone,  label: "Phone",    value: "+1 (555) 123-4567",                          color: "bg-[#22C55E]/10 text-[#22C55E]" },
    { Icon: Mail,   label: "Email",    value: "hello@rmsrestaurant.com",                    color: "bg-blue-100 text-blue-600" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-10 overflow-hidden rounded-3xl border border-[#FFE4D6] bg-white text-center shadow-sm">
        <div className="h-1.5 gradient-primary" />
        <div className="p-8">
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring" }}
            className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-[#FF6B35]/25">
            <MessageSquare className="size-8 text-white" />
          </motion.div>
          <h1 className="font-poppins text-3xl font-black text-[#111827]">Contact <span className="gradient-text">Us</span></h1>
          <p className="mt-2 text-sm text-[#6B7280]">Have a question or feedback? We&apos;d love to hear from you.</p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-5">

        {/* Form — 3 cols */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
            <div className="h-1 gradient-primary" />
            <div className="p-6">
              <h2 className="mb-5 font-poppins text-base font-bold text-[#111827]">Send a Message</h2>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-10 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                      className="flex size-16 items-center justify-center rounded-full bg-[#22C55E]/15">
                      <CheckCircle2 className="size-8 text-[#22C55E]" />
                    </motion.div>
                    <div>
                      <p className="font-poppins text-lg font-bold text-[#111827]">Message Sent!</p>
                      <p className="mt-1 text-sm text-[#6B7280]">We&apos;ll get back to you within 24 hours.</p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setSent(false)}
                        className="rounded-xl border border-[#FFE4D6] px-5 py-2.5 text-sm font-semibold text-[#6B7280] hover:border-[#FF6B35]/30">
                        Send Another
                      </button>
                      <Link href={link("/home")}
                        className="rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-md">
                        Back to Home
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Name *</label>
                        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={inputCls} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Email *</label>
                        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Subject</label>
                      <input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Message *</label>
                      <textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)}
                        placeholder="Your message…" className={inputCls + " resize-none"} />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      type="submit" disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 disabled:opacity-60">
                      {loading ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : <><Send className="size-4" /> Send Message</>}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Info — 2 cols */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 lg:col-span-2">
          {CONTACT_INFO.map(({ Icon, label, value, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -3 }}
              className="flex items-start gap-4 rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm transition-all hover:shadow-md hover:shadow-[#FF6B35]/8">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-[#111827]">{value}</p>
              </div>
            </motion.div>
          ))}

          {/* Hours card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Opening Hours</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6B7280]">Mon – Fri</span><span className="font-semibold text-[#111827]">11 AM – 10 PM</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Sat – Sun</span><span className="font-semibold text-[#111827]">10 AM – 11 PM</span></div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#22C55E]/10 px-3 py-2">
                <span className="size-2 animate-pulse rounded-full bg-[#22C55E]" />
                <span className="text-xs font-bold text-[#22C55E]">Open Now</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
