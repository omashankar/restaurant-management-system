const fs = require("fs");
const path = require("path");
const target = path.resolve(__dirname, "../src/app/super-admin/landing-site/page.jsx");

const remaining = `

/* ═══════════════════════════════════════════════════════════
   PRICING PANEL
═══════════════════════════════════════════════════════════ */
function PricingPanel({ data, onChange, onSave, saving }) {
  const plans = Array.isArray(data) ? data : [];
  const [editIdx, setEditIdx]     = useState(null);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);

  const EMPTY = { name: "", price: { monthly: 0, yearly: 0 }, description: "", highlight: false, badge: "", cta: "Start Free Trial", features: [] };

  const handleSaveItem = async (form) => {
    setItemSaving(true);
    const updated = editIdx === -1
      ? [...plans, { id: Date.now().toString(36), ...form }]
      : plans.map((p, i) => i === editIdx ? { ...p, ...form } : p);
    onChange(updated);
    await onSave(updated);
    setEditIdx(null);
    setItemSaving(false);
  };

  const handleDelete = async () => {
    const updated = plans.filter((_, i) => i !== deleteIdx);
    onChange(updated);
    await onSave(updated);
    setDeleteIdx(null);
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={CreditCard} title="Pricing Plans" description="Manage subscription tiers, prices, and feature lists." color="text-emerald-400" bg="bg-emerald-500/15" ring="ring-emerald-500/25" />
      <div className="space-y-2">
        {plans.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-600">No plans yet.</div>
        )}
        {plans.map((p, i) => (
          <div key={p.id ?? i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
              {p.highlight ? "★" : "#"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-100">{p.name}</p>
                {p.badge && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">{p.badge}</span>}
                {p.highlight && <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold text-indigo-400">Highlighted</span>}
              </div>
              <p className="text-xs text-zinc-500">\${p.price?.monthly}/mo · {p.features?.length ?? 0} features</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setEditIdx(i)} className="cursor-pointer rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700/60 hover:text-zinc-200 transition-colors"><Pencil className="size-3.5" /></button>
              <button type="button" onClick={() => setDeleteIdx(i)} className="cursor-pointer rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"><Trash2 className="size-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEditIdx(-1)} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
        <Plus className="size-4" /> Add Plan
      </button>
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)} title={editIdx === -1 ? "Add Plan" : "Edit Plan"}>
        {editIdx !== null && (
          <PlanFormInline item={editIdx >= 0 ? plans[editIdx] : EMPTY} onSave={handleSaveItem} onClose={() => setEditIdx(null)} saving={itemSaving} />
        )}
      </Modal>
      <ConfirmDialog open={deleteIdx !== null} title="Delete plan?" message={deleteIdx !== null ? \`"\${plans[deleteIdx]?.name}" will be permanently deleted.\` : ""} confirmLabel="Delete" onCancel={() => setDeleteIdx(null)} onConfirm={handleDelete} />
    </div>
  );
}

function PlanFormInline({ item, onSave, onClose, saving }) {
  const [form, setForm] = useState({ ...item, price: { monthly: item?.price?.monthly ?? 0, yearly: item?.price?.yearly ?? 0 } });
  const [errors, setErrors] = useState({});
  const [featInput, setFeatInput] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Plan name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFeat = () => {
    if (!featInput.trim()) return;
    setForm(f => ({ ...f, features: [...(f.features ?? []), { text: featInput.trim(), included: true }] }));
    setFeatInput("");
  };

  return (
    <div className="space-y-4">
      <Field label="Plan Name" required error={errors.name}>
        <input value={form.name ?? ""} onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }} placeholder="Pro" className={ic} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Monthly Price ($)" required>
          <input type="number" min="0" value={form.price.monthly} onChange={(e) => setForm(f => ({ ...f, price: { ...f.price, monthly: Number(e.target.value) } }))} className={ic} />
        </Field>
        <Field label="Yearly Price ($)">
          <input type="number" min="0" value={form.price.yearly} onChange={(e) => setForm(f => ({ ...f, price: { ...f.price, yearly: Number(e.target.value) } }))} className={ic} />
        </Field>
        <Field label="Badge">
          <input value={form.badge ?? ""} onChange={(e) => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Most Popular" className={ic} />
        </Field>
        <Field label="CTA Text">
          <input value={form.cta ?? ""} onChange={(e) => setForm(f => ({ ...f, cta: e.target.value }))} placeholder="Start Free Trial" className={ic} />
        </Field>
      </div>
      <Field label="Description">
        <input value={form.description ?? ""} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Perfect for growing restaurants." className={ic} />
      </Field>
      <Toggle checked={!!form.highlight} onChange={(v) => setForm(f => ({ ...f, highlight: v }))} label="Highlighted plan" description="Shows with accent border." />
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Features</label>
        <div className="space-y-1.5 mb-2">
          {(form.features ?? []).map((feat, i) => (
            <div key={i} className="flex items-center gap-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, features: f.features.map((x, idx) => idx === i ? { ...x, included: !x.included } : x) }))}
                className={"cursor-pointer flex size-5 shrink-0 items-center justify-center rounded border transition-colors " + (feat.included ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-zinc-600 bg-zinc-800")}>
                {feat.included && <Check className="size-3" strokeWidth={3} />}
              </button>
              <span className="flex-1 text-xs text-zinc-300">{feat.text}</span>
              <button type="button" onClick={() => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))} className="cursor-pointer rounded p-1 text-zinc-600 hover:text-red-400"><Trash2 className="size-3" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={featInput} onChange={(e) => setFeatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeat())} placeholder="Add feature, press Enter" className={ic + " flex-1"} />
          <button type="button" onClick={addFeat} className="cursor-pointer rounded-xl border border-zinc-700 px-3 py-2 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"><Plus className="size-4" /></button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">Cancel</button>
        <button type="button" disabled={saving} onClick={() => { if (validate()) onSave(form); }} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">{saving ? "Saving\u2026" : "Save Plan"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TESTIMONIALS PANEL
═══════════════════════════════════════════════════════════ */
function TestimonialsPanel({ data, onChange, onSave, saving }) {
  const items = Array.isArray(data) ? data : [];
  const [editIdx, setEditIdx]     = useState(null);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const EMPTY = { name: "", role: "", quote: "", avatar: "" };

  const handleSaveItem = async (form) => {
    setItemSaving(true);
    const updated = editIdx === -1
      ? [...items, { id: Date.now().toString(36), ...form }]
      : items.map((t, i) => i === editIdx ? { ...t, ...form } : t);
    onChange(updated);
    await onSave(updated);
    setEditIdx(null);
    setItemSaving(false);
  };

  const handleDelete = async () => {
    const updated = items.filter((_, i) => i !== deleteIdx);
    onChange(updated);
    await onSave(updated);
    setDeleteIdx(null);
  };

  return (
    <div className="space-y-5">
      <SectionHeader icon={MessageSquare} title="Testimonials" description="Customer reviews shown on the landing page." color="text-rose-400" bg="bg-rose-500/15" ring="ring-rose-500/25" />
      <div className="space-y-2">
        {items.length === 0 && <div className="rounded-xl border border-dashed border-zinc-800 py-10 text-center text-sm text-zinc-600">No testimonials yet.</div>}
        {items.map((t, i) => (
          <div key={t.id ?? i} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 hover:border-zinc-700 transition-colors">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-400 ring-1 ring-rose-500/20">{t.name?.[0]?.toUpperCase() ?? "?"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{t.name} <span className="text-xs font-normal text-zinc-500">· {t.role}</span></p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">"{t.quote}"</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setEditIdx(i)} className="cursor-pointer rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700/60 hover:text-zinc-200 transition-colors"><Pencil className="size-3.5" /></button>
              <button type="button" onClick={() => setDeleteIdx(i)} className="cursor-pointer rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"><Trash2 className="size-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEditIdx(-1)} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 transition-colors">
        <Plus className="size-4" /> Add Testimonial
      </button>
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)} title={editIdx === -1 ? "Add Testimonial" : "Edit Testimonial"}>
        {editIdx !== null && (
          <TestimonialFormInline item={editIdx >= 0 ? items[editIdx] : EMPTY} onSave={handleSaveItem} onClose={() => setEditIdx(null)} saving={itemSaving} />
        )}
      </Modal>
      <ConfirmDialog open={deleteIdx !== null} title="Delete testimonial?" message={deleteIdx !== null ? \`"\${items[deleteIdx]?.name}" will be removed.\` : ""} confirmLabel="Delete" onCancel={() => setDeleteIdx(null)} onConfirm={handleDelete} />
    </div>
  );
}

function TestimonialFormInline({ item, onSave, onClose, saving }) {
  const [form, setForm] = useState({ ...item });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required.";
    if (!form.quote?.trim()) e.quote = "Quote is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>
          <input value={form.name ?? ""} onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }} placeholder="Rahul Mehta" className={ic} />
        </Field>
        <Field label="Role / Title">
          <input value={form.role ?? ""} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Operations Manager" className={ic} />
        </Field>
      </div>
      <Field label="Quote" required error={errors.quote}>
        <textarea rows={3} value={form.quote ?? ""} onChange={(e) => { setForm(f => ({ ...f, quote: e.target.value })); setErrors(p => ({ ...p, quote: "" })); }} placeholder="What they said about RMS\u2026" className={ic + " resize-none"} />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">Cancel</button>
        <button type="button" disabled={saving} onClick={() => { if (validate()) onSave(form); }} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors">{saving ? "Saving\u2026" : "Save"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FOOTER PANEL
═══════════════════════════════════════════════════════════ */
function FooterPanel({ data, onChange, onSave, saving }) {
  const links = Array.isArray(data.links) ? data.links : [];
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!data.companyName?.trim()) e.companyName = "Company name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateLink = (i, key, val) => onChange("links", links.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  const addLink    = () => onChange("links", [...links, { label: "", href: "" }]);
  const removeLink = (i) => onChange("links", links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionHeader icon={Mail} title="Footer" description="Company info, contact details, and footer links." color="text-zinc-400" bg="bg-zinc-800" ring="ring-zinc-700" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" required error={errors.companyName}>
          <input value={data.companyName ?? ""} onChange={(e) => { onChange("companyName", e.target.value); setErrors(p => ({ ...p, companyName: "" })); }} placeholder="Restaurant OS" className={ic} />
        </Field>
        <Field label="Tagline">
          <input value={data.tagline ?? ""} onChange={(e) => onChange("tagline", e.target.value)} placeholder="All-in-one restaurant management\u2026" className={ic} />
        </Field>
        <Field label="Support Email">
          <input type="email" value={data.email ?? ""} onChange={(e) => onChange("email", e.target.value)} placeholder="support@restaurantos.com" className={ic} />
        </Field>
        <Field label="Phone">
          <input value={data.phone ?? ""} onChange={(e) => onChange("phone", e.target.value)} placeholder="+1 (555) 000-0000" className={ic} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input value={data.address ?? ""} onChange={(e) => onChange("address", e.target.value)} placeholder="123 Main Street, City, Country" className={ic} />
          </Field>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">Footer Links</label>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={l.label ?? ""} onChange={(e) => updateLink(i, "label", e.target.value)} placeholder="Label" className={ic + " flex-1"} />
              <input value={l.href ?? ""} onChange={(e) => updateLink(i, "href", e.target.value)} placeholder="/url or #anchor" className={ic + " flex-1"} />
              <button type="button" onClick={() => removeLink(i)} className="cursor-pointer rounded-lg p-2 text-zinc-600 hover:bg-red-500/15 hover:text-red-400 transition-colors"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <button type="button" onClick={addLink} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors">
            <Plus className="size-4" /> Add Link
          </button>
        </div>
      </div>
      <SaveBtn saving={saving} onClick={() => { if (validate()) onSave(); }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function LandingSitePage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent]     = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const { showToast, ToastUI }    = useToast();
  const panelRef                  = useRef(null);

  /* Fetch all content */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/super-admin/landing");
        const data = await res.json();
        if (data.success) setContent(data.content);
        else showToast(data.error ?? "Failed to load.", "error");
      } catch { showToast("Network error.", "error"); }
      finally { setFetching(false); }
    })();
  }, [showToast]);

  /* Generic field change for object sections */
  const handleChange = useCallback((keyOrValue, val) => {
    setContent((prev) => {
      const arrSections = ["features", "roles", "pricing", "testimonials"];
      if (arrSections.includes(activeTab)) {
        return { ...prev, [activeTab]: keyOrValue };
      }
      return { ...prev, [activeTab]: { ...prev[activeTab], [keyOrValue]: val } };
    });
  }, [activeTab]);

  /* Save active section */
  const handleSave = useCallback(async (overrideData) => {
    if (!content) return;
    setSaving(true);
    try {
      const sectionData = overrideData !== undefined ? overrideData : content[activeTab];
      const res = await fetch("/api/super-admin/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, data: sectionData }),
      });
      const data = await res.json();
      if (!data.success) { showToast(data.error ?? "Failed to save.", "error"); return; }
      showToast("Section saved.");
    } catch { showToast("Network error.", "error"); }
    finally { setSaving(false); }
  }, [activeTab, content, showToast]);

  const switchTab = (id) => {
    setActiveTab(id);
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionData = content?.[activeTab] ?? {};

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25">
            <Globe className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Landing Site</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage your public-facing website content. Changes go live immediately.</p>
          </div>
        </div>
        <Link href="/" target="_blank"
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
          <ExternalLink className="size-4" /> Preview Site
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Tab sidebar */}
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:w-48 lg:shrink-0 lg:pb-0">
          {TABS.map(({ id, label, Icon, color }) => {
            const active = id === activeTab;
            return (
              <button key={id} type="button" onClick={() => switchTab(id)}
                className={"cursor-pointer flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap lg:w-full " + (active ? "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300")}>
                <Icon className={"size-4 shrink-0 " + (active ? color : "")} />
                {label}
                {active && <ChevronRight className="ml-auto size-3.5 text-zinc-600 hidden lg:block" />}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div ref={panelRef} className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
          {fetching ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-zinc-800/60" />
              ))}
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="size-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">Failed to load content.</p>
              <button type="button" onClick={() => window.location.reload()} className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                <RefreshCw className="size-4 inline mr-1.5" />Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === "hero"         && <HeroPanel         data={sectionData}          onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "features"     && <FeaturesPanel     data={content.features}     onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "roles"        && <RolesPanel        data={content.roles}        onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "pricing"      && <PricingPanel      data={content.pricing}      onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "testimonials" && <TestimonialsPanel data={content.testimonials} onChange={handleChange} onSave={handleSave} saving={saving} />}
              {activeTab === "footer"       && <FooterPanel       data={sectionData}          onChange={handleChange} onSave={handleSave} saving={saving} />}
            </>
          )}
        </div>
      </div>

      {ToastUI}
    </div>
  );
}
`;

fs.appendFileSync(target, remaining, "utf8");
console.log("Done. Total bytes:", fs.readFileSync(target, "utf8").length);
