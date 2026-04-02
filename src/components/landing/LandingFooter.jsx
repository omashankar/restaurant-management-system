export default function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-medium text-slate-700">
            © {new Date().getFullYear()} RMS. All rights reserved.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Built for modern restaurants and growing operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#features" className="transition-colors hover:text-slate-900">
            Features
          </a>
          <a href="#demo" className="transition-colors hover:text-slate-900">
            Demo
          </a>
          <a href="#contact" className="transition-colors hover:text-slate-900">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
