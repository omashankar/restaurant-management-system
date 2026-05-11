import Link from "next/link";

export const metadata = {
  title: "Terms of Use · Restaurant OS",
  description: "Terms of use for Restaurant OS platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-14 text-slate-800 sm:px-6">
      <article className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Terms of Use</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          This is a placeholder terms-of-use page. Replace it with legally binding terms covering
          access to the service, subscriptions and billing, acceptable use, liability limits,
          and dispute resolution applicable to your business.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>Define who may use the product and acceptable behaviour.</li>
          <li>Reference your refund / cancellation policy for SaaS billing.</li>
          <li>Include governing law and how changes to terms are communicated.</li>
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
