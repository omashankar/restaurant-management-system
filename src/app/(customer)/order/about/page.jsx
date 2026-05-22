"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { motion, useInView } from "framer-motion";
import { Clock, MapPin, Phone, Award, Zap, Heart, ArrowRight, ChefHat, Star, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: Award,  title: "Quality First",   desc: "Every dish is crafted with premium ingredients sourced from local farms and trusted suppliers." },
  { icon: Zap,    title: "Fast Service",    desc: "We respect your time. Most orders are ready in under 20 minutes — fresh and hot." },
  { icon: Heart,  title: "Made with Love",  desc: "Our chefs pour passion into every plate. Dining here is more than a meal — it's an experience." },
];

const DEFAULT_STATS = [
  { value: "50+",  label: "Menu Items",      icon: ChefHat },
  { value: "4.9★", label: "Average Rating",  icon: Star },
  { value: "2K+",  label: "Happy Customers", icon: Users },
  { value: "5 yrs",label: "Experience",      icon: Award },
];

const PROMISES = [
  "Fresh ingredients every day",
  "No artificial preservatives",
  "Locally sourced produce",
  "Hygienic kitchen standards",
  "Friendly & fast service",
  "Dine-in, Takeaway & Delivery",
];

export default function AboutPage() {
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const stats = cms.about?.stats?.length > 0 ? cms.about.stats : DEFAULT_STATS;

  return (
    <div className="bg-gray-50">

      {/* ══ HERO ══ */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Left */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
                Our Story
              </span>
              <h1 className="font-poppins text-4xl font-black leading-tight text-[#111827] sm:text-5xl">
                About{" "}
                <span className="gradient-text">{info.name}</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-gray-500">
                {cms.about?.description || "We started with a simple mission — to serve fresh, delicious food with warm hospitality. Every dish is crafted with love and the finest ingredients, bringing people together one meal at a time."}
              </p>

              {/* Promise list */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {PROMISES.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="size-4 shrink-0 text-[#FF6B35]" />
                    {p}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={link("/order/menu")}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 transition-all hover:scale-105">
                  View Menu <ArrowRight className="size-4" />
                </Link>
                <Link href={link("/order/table-booking")}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-7 py-3.5 text-sm font-bold text-[#111827] transition-all hover:border-[#FF6B35]/40">
                  Book a Table
                </Link>
              </div>
            </motion.div>

            {/* Right — image collage */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-3">
              {/* Large top */}
              <div className="col-span-2 overflow-hidden rounded-3xl shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=85"
                  alt="signature dish"
                  className="h-56 w-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"; }}
                />
              </div>
              {/* Bottom 3 */}
              {[
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
                "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
                "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80",
              ].map((src, i) => (
                <div key={i} className={`overflow-hidden rounded-2xl shadow-md ${i === 2 ? "col-span-2" : ""}`}>
                  <img src={src} alt="food"
                    className={`w-full object-cover transition-transform duration-500 hover:scale-105 ${i === 2 ? "h-36" : "h-36"}`}
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80"; }}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="bg-[#111827] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {stats.map(({ value, label, icon: Icon }) => (
              <motion.div key={label} variants={fadeUp}
                className="text-center">
                {Icon && (
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#FF6B35]/15">
                    <Icon className="size-6 text-[#FF6B35]" />
                  </div>
                )}
                <p className="font-poppins text-3xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF6B35]">Why Choose Us</span>
              <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">What Makes Us Special</h2>
              <p className="mt-3 text-sm text-gray-500">We go above and beyond to make every visit memorable.</p>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <motion.div key={title} variants={fadeUp} whileHover={{ y: -6 }}
                  className="group rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-[#FF6B35]/8">
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl gradient-primary shadow-md shadow-[#FF6B35]/20 transition-transform group-hover:scale-110">
                    <Icon className="size-7 text-white" />
                  </div>
                  <h3 className="font-poppins text-lg font-black text-[#111827]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══ VISIT US ══ */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#FF6B35]">Find Us</span>
              <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">Visit Us</h2>
            </motion.div>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { Icon: MapPin, label: "Address", value: info.address || "123 Restaurant Street, Food City", color: "bg-[#FF6B35]/10 text-[#FF6B35]" },
                { Icon: Phone,  label: "Phone",   value: info.phone   || "+1 (555) 123-4567",               color: "bg-green-100 text-green-600" },
                { Icon: Clock,  label: "Hours",   value: info.hoursSummary || "Mon–Sun · 11 AM – 11 PM",    color: "bg-amber-100 text-amber-600" },
              ].map(({ Icon, label, value, color }) => (
                <motion.div key={label} variants={fadeUp} whileHover={{ y: -4 }}
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
          </AnimatedSection>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl gradient-primary px-8 py-14 text-center shadow-2xl shadow-[#FF6B35]/20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            <h3 className="relative font-poppins text-3xl font-black text-white sm:text-4xl">Ready to Taste the Difference?</h3>
            <p className="relative mt-3 text-sm text-white/75">Order online or visit us — we&apos;re always ready to serve you.</p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={link("/order/menu")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#FF6B35] shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                Order Now <ArrowRight className="size-4" />
              </Link>
              <Link href={link("/order/contact")}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 bg-white/15 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
