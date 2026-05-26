"use client";

import CmsSaveActions from "@/components/customer-site/CmsSaveActions";
import { layoutInputCls, LayoutField } from "@/components/customer-site/layoutEditorUi";

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourpage" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/yourpage" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/919876543210" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourpage" },
];

export default function SocialUrlsEditor({ social, setSocial, saving, onSaveDraft, onPublish }) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-200">Social media links</p>
        <p className="mt-1 text-xs text-zinc-500">
          One place for all URLs — shown in the header top bar and footer icons. Turn icons on/off in
          Footer editor.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
          <LayoutField key={key} label={label}>
            <input
              value={social[key] ?? ""}
              onChange={(e) => setSocial((p) => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              className={layoutInputCls}
            />
          </LayoutField>
        ))}
      </div>
      <CmsSaveActions
        section="social"
        saving={saving}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        publishLabel="Publish social links"
      />
    </div>
  );
}
