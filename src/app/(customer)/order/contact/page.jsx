"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const { showToast } = useCustomer();
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast("All fields are required.", "error"); return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setForm({ name: "", email: "", subject: "", message: "" });
    setSent(true);
    showToast("Message sent! We'll get back to you soon.");
  };

  const inputCls = "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#FF6B35]/40 focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/10";

  const CONTACT_INFO = [
    { Icon: MapPin, label: "Address", value: info.address || "123 Restaurant Street, Food City", color: "bg-[#FF6B35]/10 text-[#FF6B35]" },
    { Icon: Phone,  label: "Phone",   value: info.phone   || "+1 (555) 123-4567",               color: "bg-green-100 text-green-600" },
    { Icon: Mail,   label: "Email",   value: info.email   || "hello@restaurant.com",             color: "bg-blue-100 text-blue-600" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ══ HERO ══ */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
              Get in Touch
            </span>
            <h1 className="font-poppins text-4xl font-black text-[#111827] sm:text-5xl">
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base">
              Have a question, feedback, or just want to say hello? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ CONTACT INFO CARDS ══ */}
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-3">
            {CONTACT_INFO.map(({ Icon, label, value, color }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#111827]">{value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FORM + HOURS ══ */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">

            {/* Form — 3 cols */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-3">
              <div className="rounded-3xl bg-gray-50 p-8">
                <h2 className="mb-6 font-poppins text-2xl font-black text-[#111827]">Send a Message</h2>

                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div key="success"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-5 py-12 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                        className="flex size-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="size-10 text-green-500" />
                      </motion.div>
                      <div>
                        <p className="font-poppins text-xl font-black text-[#111827]">Message Sent!</p>
                        <p className="mt-1 text-sm text-gray-500">We&apos;ll get back to you within 24 hours.</p>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setSent(false)}
                          className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:border-[#FF6B35]/30">
                          Send Another
                        </button>
                        <Link href={link("/home")}
                          className="rounded-full gradient-primary px-6 py-2.5 text-sm font-bold text-white shadow-md">
                          Back to Home
                        </Link>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={submit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Name *</label>
                          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={inputCls} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Email *</label>
                          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Subject</label>
                        <input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" className={inputCls} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Message *</label>
                        <textarea rows={5} value={form.message} onChange={(e) => set("message", e.target.value)}
                          placeholder="Your message…" className={inputCls + " resize-none"} />
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        type="submit" disabled={loading}
                        className="flex cursor-pointer w-full items-center justify-center gap-2 rounded-full gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 disabled:opacity-60">
                        {loading ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : <><Send className="size-4" /> Send Message</>}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Hours — 2 cols */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="lg:col-span-2">
              <div className="rounded-3xl bg-gray-50 p-8 h-full">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-amber-100">
                  <Clock className="size-6 text-amber-600" />
                </div>
                <h3 className="font-poppins text-xl font-black text-[#111827]">Opening Hours</h3>
                <p className="mt-1 text-sm text-gray-400">We&apos;re here to serve you</p>

                <div className="mt-6 space-y-3">
                  {info.openingHours?.length > 0 ? (
                    info.openingHours.map((h) => (
                      <div key={h.day} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">{h.day}</span>
                        {h.closed ? (
                          <span className="text-xs font-bold text-red-400">Closed</span>
                        ) : (
                          <span className="text-sm font-bold text-[#111827]">{h.openTime} – {h.closeTime}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    [
                      { day: "Mon – Fri", time: "11:00 AM – 10:00 PM" },
                      { day: "Saturday",  time: "10:00 AM – 11:00 PM" },
                      { day: "Sunday",    time: "10:00 AM – 09:00 PM" },
                    ].map((h) => (
                      <div key={h.day} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">{h.day}</span>
                        <span className="text-sm font-bold text-[#111827]">{h.time}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Open/Closed indicator */}
                <div className={`mt-5 flex items-center gap-2.5 rounded-2xl px-4 py-3 ${info.isOpenToday ? "bg-green-50" : "bg-red-50"}`}>
                  <span className={`size-2.5 rounded-full ${info.isOpenToday ? "animate-pulse bg-green-500" : "bg-red-400"}`} />
                  <span className={`text-sm font-bold ${info.isOpenToday ? "text-green-600" : "text-red-500"}`}>
                    {info.isOpenToday ? `Open Now · ${info.todayLabel ?? ""}` : "Closed Today"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
