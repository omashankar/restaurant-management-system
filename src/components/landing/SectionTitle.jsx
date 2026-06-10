export default function SectionTitle({ eyebrow, title, subtext }) {
  return (
    <div className="mx-auto max-w-3xl min-w-0 text-center">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
        <span className="hidden h-px w-6 bg-indigo-200 sm:inline-block" aria-hidden />
        {eyebrow}
        <span className="hidden h-px w-6 bg-indigo-200 sm:inline-block" aria-hidden />
      </p>
      <h2 className="mt-3 break-words px-1 text-xl font-bold tracking-tight text-slate-900 sm:px-0 sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {subtext ? (
        <p className="mx-auto mt-3 max-w-2xl break-words text-sm leading-relaxed text-slate-600 md:text-base">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
