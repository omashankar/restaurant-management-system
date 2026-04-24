"use client";

import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";

/**
 * ContactSection — "use client" because of the form state.
 *
 * Props:
 *   contact: {
 *     email:       string
 *     phone:       string
 *     address:     string
 *     mapUrl:      string   (optional Google Maps embed URL)
 *     formEnabled: boolean  (default true)
 *   }
 */
export default function ContactSection({ contact = {} }) {
  const {
    email       = "support@restaurantos.com",
    phone       = "+1 (555) 000-0000",
    address     = "123 Main Street, City, Country",
    mapUrl      = "",
    formEnabled = true,
  } = contact;

  const [form, setForm]       = useState({ name: "", email: "", message: "" });
  const [status, setStatus]   = useState(null); // null | "sending" | "sent" | "error"
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.email.trim())   e.email   = "Email is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    /* Replace with your actual form submission endpoint */
    await new Promise(r => setTimeout(r, 1000));
    setStatus("sent");
    setForm({ name: "", email: "", message: "" });
  };

  const ic = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400";

  return (
    <section id="contact" className="scroll-mt-16 bg-slate-50 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Contact</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Get in touch
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Have a question or want to see a demo? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">

          {/* ── Contact info ── */}
          <div className="space-y-6">
            {/* Info cards */}
            {[
              { Icon: Mail,    label: "Email",   value: email,   href: `mailto:${email}`   },
              { Icon: Phone,   label: "Phone",   value: phone,   href: `tel:${phone}`      },
              { Icon: MapPin,  label: "Address", value: address, href: null                },
            ].map(({ Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  {href ? (
                    <a href={href} className="cursor-pointer mt-1 text-sm font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Map embed */}
            {mapUrl && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location map"
                />
              </div>
            )}
          </div>

          {/* ── Contact form ── */}
          {formEnabled && (
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              {status === "sent" ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Send className="size-6" />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-slate-900">Message sent!</p>
                    <p className="mt-1 text-sm text-slate-500">We&apos;ll get back to you within 24 hours.</p>
                  </div>
                  <button type="button" onClick={() => setStatus(null)}
                    className="cursor-pointer mt-2 rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <h3 className="text-base font-bold text-slate-900">Send us a message</h3>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }}
                      placeholder="John Smith"
                      className={ic}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(p => ({ ...p, email: "" })); }}
                      placeholder="john@restaurant.com"
                      className={ic}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(p => ({ ...p, message: "" })); }}
                      placeholder="Tell us about your restaurant and what you need…"
                      className={`${ic} resize-none`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="size-4" /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
