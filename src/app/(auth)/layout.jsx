export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
}
