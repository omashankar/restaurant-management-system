/**
 * Seamless marquee: two identical halves → translate -50% loops without a jump.
 */
function buildSeamlessTrack(brands, minPerHalf = 12) {
  const half = [];
  while (half.length < minPerHalf) {
    half.push(...brands);
  }
  return [...half, ...half];
}

export default function BrandMarquee({ eyebrow = "Trusted by", brands = [] }) {
  if (!brands.length) return null;

  const track = buildSeamlessTrack(brands);

  return (
    <section className="group/marquee overflow-hidden border-y border-slate-200 bg-slate-50/50 py-6">
      <div className="mx-auto mb-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          {eyebrow}
        </p>
      </div>

      {/* Animated marquee — all screen sizes */}
      <div className="relative w-full overflow-hidden motion-reduce:hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50 via-slate-50/90 to-transparent sm:w-20" />

        <div
          className="landing-marquee-track flex w-max items-center gap-3 py-1 pl-3 sm:gap-4 sm:pl-4 group-hover/marquee:[animation-play-state:paused]"
          style={{ animation: "landing-marquee 28s linear infinite" }}
        >
          {track.map((brand, index) => (
            <span
              key={`${brand}-${index}`}
              className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-500 shadow-sm sm:px-5 sm:py-2"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* Static fallback when user prefers reduced motion */}
      <div className="mx-auto hidden max-w-7xl flex-wrap justify-center gap-2 px-4 motion-reduce:flex sm:gap-3 sm:px-6 lg:px-8">
        {brands.map((brand) => (
          <span
            key={`rm-${brand}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-500 shadow-sm"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
