import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · Restaurant OS",
  description: "Privacy policy for Restaurant OS platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-14 text-slate-800 sm:px-6">
      <article className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          This is a placeholder privacy policy page. Replace this content with wording approved by your
          legal counsel, including details on what data you collect, how it is processed, retention,
          sub-processors, and contact for data subject requests.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Clearly describe cookies, analytics, and payment provider handling.</li>
          <li>Link to how users can export or delete their account data.</li>
          <li>State jurisdiction and supervisory authority where applicable.</li>
        </ul>
        <p className="mt-8">
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            ← Back to home
          </Link>
        </p>
      </article>
    </main>
  );
}
