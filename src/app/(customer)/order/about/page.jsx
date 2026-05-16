"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion, useInView } from "framer-motion";
import { Clock, MapPin, Phone, Star, UtensilsCrossed, Award, Zap, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

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
  { icon: Award,  title: "Quality First",   desc: "Every dish is crafted with premium ingredients sourced from local farms and trusted suppliers.", color: "bg-[#FF6B35]/10 text-[#FF6B35]" },
  { icon: Zap,    title: "Fast Service",    desc: "We respect your time. Most orders are ready in under 20 minutes — fresh and hot.", color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
  { icon: Heart,  title: "Dine or Deliver", desc: "Enjoy in our cozy space or get it delivered fresh to your door — your choice.", color: "bg-rose-100 text-rose-500" },
];

const STATS = [
  { value: "50+", label: "Menu Items" },
  { value: "4.9★", label: "Rating" },
  { value: "2K+", label: "Happy Customers" },
  { value: "5 yrs", label: "Experience" },
];

export default function AboutPage() {
  const { link } = useRestaurantSlug();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-10 overflow-hidden rounded-3xl border border-[#FFE4D6] bg-white text-center shadow-sm">
        <div className="h-1.5 gradient-primary" />
        <div className="p-10">
          <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }}
            className="mx-auto mb-5 flex size-20 items-center justify-center rounded-2xl gradient-primary shadow-xl shadow-[#FF6B35]/25">
            <UtensilsCrossed className="size-10 text-white" />
          </motion.div>
          <h1 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">
            About <span className="gradient-text">RMS Restaurant</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#6B7280] sm:text-base">
            A modern dining experience built on fresh ingredients, bold flavors, and warm hospitality — every single day.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href={link("/order/menu")}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25">
                View Menu <ArrowRight className="size-4" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href={link("/order/table-booking")}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#FFE4D6] bg-white px-6 py-3 text-sm font-bold text-[#111827] transition-all hover:border-[#FF6B35]/40">
                Book a Table
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <AnimatedSection className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(({ value, label }) => (
          <motion.div key={label} variants={fadeUp} whileHover={{ y: -4 }}
            className="rounded-2xl border border-[#FFE4D6] bg-white p-5 text-center shadow-sm transition-all hover:shadow-md hover:shadow-[#FF6B35]/8">
            <p className="font-poppins text-2xl font-black text-[#FF6B35]">{value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{label}</p>
          </motion.div>
        ))}
      </AnimatedSection>

      {/* Features */}
      <AnimatedSection className="mb-10 grid gap-5 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <motion.div key={title} variants={fadeUp} whileHover={{ y: -5 }}
            className="rounded-2xl border border-[#FFE4D6] bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:shadow-[#FF6B35]/8">
            <div className={`mb-4 flex size-12 items-center justify-center rounded-2xl ${color}`}>
              <Icon className="size-6" />
            </div>
            <h3 className="font-poppins font-bold text-[#111827]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{desc}</p>
          </motion.div>
        ))}
      </AnimatedSection>

      {/* Visit Us */}
      <AnimatedSection>
        <motion.div variants={fadeUp}
          className="overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
          <div className="h-1 gradient-primary" />
          <div className="p-6">
            <h2 className="mb-5 font-poppins text-lg font-bold text-[#111827]">Visit Us</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { Icon: MapPin, label: "Address", value: "123 Restaurant Street, Food City, FC 10001", color: "bg-[#FF6B35]/10 text-[#FF6B35]" },
                { Icon: Phone,  label: "Phone",   value: "+1 (555) 123-4567",                          color: "bg-[#22C55E]/10 text-[#22C55E]" },
                { Icon: Clock,  label: "Hours",   value: "Mon–Sun · 11 AM – 11 PM",                   color: "bg-[#F59E0B]/10 text-[#F59E0B]" },
              ].map(({ Icon, label, value, color }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-[#FFF8F3] p-4">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#111827]">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatedSection>

    </div>
  );
}
