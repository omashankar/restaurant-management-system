import { Clock, MapPin, Phone, Star, UtensilsCrossed } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 rounded-3xl border border-zinc-200 bg-white/85 p-8 text-center shadow-sm">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20">
          <UtensilsCrossed className="size-8" />
        </span>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900">About RMS Restaurant</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">
          A modern dining experience built on fresh ingredients, bold flavors, and warm hospitality.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Star,    title: "Quality First",    desc: "Every dish is crafted with premium ingredients sourced from local farms." },
          { icon: Clock,   title: "Fast Service",     desc: "We respect your time. Most orders are ready in under 20 minutes." },
          { icon: MapPin,  title: "Dine or Deliver",  desc: "Enjoy in our cozy space or get it delivered fresh to your door." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-3 font-semibold text-zinc-900">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-zinc-900">Visit Us</h2>
        <div className="grid gap-4 sm:grid-cols-3 text-sm text-zinc-700">
          <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" /><span>123 Restaurant Street, Food City, FC 10001</span></div>
          <div className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-emerald-600" /><span>+1 (555) 123-4567</span></div>
          <div className="flex items-center gap-2"><Clock className="size-4 shrink-0 text-emerald-600" /><span>Mon–Sun · 11 AM – 11 PM</span></div>
        </div>
      </div>
    </div>
  );
}
