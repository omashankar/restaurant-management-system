import "./auth-theme.css";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="auth-glow absolute -left-32 top-20 h-72 w-72 rounded-full blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
      </div>
      <div
        className="relative flex min-h-screen min-h-[100dvh] w-full min-w-0 items-center justify-center px-4 py-6 sm:p-8"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </div>
  );
}
