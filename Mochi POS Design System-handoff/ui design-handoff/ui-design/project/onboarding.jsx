// Seller onboarding — invite code redemption + first-run workspace wizard.
// Six steps. Layouts and brand warmth swap via Tweaks.

const { useState: ouseState, useMemo: ouseMemo, useEffect: ouseEffect } = React;

const STEPS = [
  { id: "claim",     label: "Claim invite",       short: "Invite" },
  { id: "account",   label: "Set up account",     short: "Account" },
  { id: "workspace", label: "Confirm workspace",  short: "Workspace" },
  { id: "products",  label: "Add products",       short: "Products" },
  { id: "event",     label: "First event",        short: "Event" },
  { id: "live",      label: "Go live",            short: "Live" }
];

// Imagined-but-plausible invite state for Khun Tan (matches APP-2026-0119 in admin)
const INVITE = {
  code: "MOCHI-TANP-2026",
  email: "tan@tanpatches.com",
  brand: "Khun Tan Patches",
  ownerFull: "Tan Naruepol",
  ownerFirst: "Tan",
  category: "Embroidered patches",
  approvedBy: "Pim T. (founder)",
  approvedNote: "Thrilled to have you — your patches stole the show at Cattober's booth last year. Welcome aboard.",
  tier: "Standard pilot"
};

// ─────────────────────────────────────────────────────────────────────────
// Root orchestrator
// ─────────────────────────────────────────────────────────────────────────

function OnboardingApp({ t, setTweak }) {
  const [stepIdx, setStepIdx] = ouseState(0);
  // Workspace state — accretive across steps
  const [ws, setWs] = ouseState({
    code: INVITE.code,
    email: INVITE.email,
    password: "",
    passwordConfirm: "",
    phone: "",
    brand: INVITE.brand,
    subdomain: "tanpatches",
    currency: "THB",
    country: "Thailand",
    timezone: "Asia/Bangkok",
    boothType: "single",
    products: [],
    event: {
      name: "",
      venue: "",
      location: "",
      startDate: "",
      endDate: "",
      boothNo: ""
    }
  });

  const stepperStyle = t.stepper; // "stepper" | "sidebar" | "minimal"
  const goNext = () => setStepIdx(i => Math.min(STEPS.length - 1, i + 1));
  const goPrev = () => setStepIdx(i => Math.max(0, i - 1));
  const jumpTo = (i) => { if (i <= stepIdx) setStepIdx(i); };

  const step = STEPS[stepIdx];

  return (
    <div className={"ob-shell ob-stepper-" + stepperStyle + " ob-warmth-" + t.warmth}>
      <OnboardingHeader stepIdx={stepIdx} stepperStyle={stepperStyle} jumpTo={jumpTo} warmth={t.warmth} />

      <div className="ob-layout">
        {stepperStyle === "sidebar" && (
          <OnboardingSidebar stepIdx={stepIdx} jumpTo={jumpTo} ws={ws} />
        )}

        <main className="ob-main">
          {stepperStyle === "minimal" && (
            <div className="ob-minimal-bar">
              <div className="ob-mb-track"><div className="ob-mb-fill" style={{ width: ((stepIdx + 1) / STEPS.length * 100) + "%" }} /></div>
              <div className="ob-mb-lbl">Step {stepIdx + 1} of {STEPS.length} · {step.label}</div>
            </div>
          )}

          <div className="ob-step-wrap" key={step.id}>
            {step.id === "claim"     && <StepClaim     ws={ws} setWs={setWs} onNext={goNext} warmth={t.warmth} />}
            {step.id === "account"   && <StepAccount   ws={ws} setWs={setWs} onNext={goNext} onPrev={goPrev} />}
            {step.id === "workspace" && <StepWorkspace ws={ws} setWs={setWs} onNext={goNext} onPrev={goPrev} />}
            {step.id === "products"  && <StepProducts  ws={ws} setWs={setWs} onNext={goNext} onPrev={goPrev} />}
            {step.id === "event"     && <StepEvent     ws={ws} setWs={setWs} onNext={goNext} onPrev={goPrev} />}
            {step.id === "live"      && <StepLive      ws={ws} warmth={t.warmth} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Header + stepper (top variant) — sticky
// ─────────────────────────────────────────────────────────────────────────

function OnboardingHeader({ stepIdx, stepperStyle, jumpTo, warmth }) {
  return (
    <header className="ob-header">
      <div className="ob-brand">
        <img src="assets/mochi-mascot.png" alt="" />
        <span className="wm">Mochi<span className="pos">POS</span></span>
      </div>

      {stepperStyle === "stepper" && (
        <ol className="ob-steps">
          {STEPS.map((s, i) => {
            const state = i < stepIdx ? "done" : i === stepIdx ? "now" : "future";
            return (
              <li key={s.id} className={"ob-step ob-step-" + state} onClick={() => jumpTo(i)}>
                <span className="ob-step-bub">
                  {state === "done" ? <Icon name="check" size={13} /> : (i + 1)}
                </span>
                <span className="ob-step-lbl">{s.short}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="ob-helper">
        <span className="muted">Need help?</span>
        <a href="#" onClick={(e) => e.preventDefault()}>founder@mochipos.app</a>
      </div>
    </header>
  );
}

function OnboardingSidebar({ stepIdx, jumpTo, ws }) {
  return (
    <aside className="ob-side">
      <div className="ob-side-eyebrow">Getting set up</div>
      <ol className="ob-side-steps">
        {STEPS.map((s, i) => {
          const state = i < stepIdx ? "done" : i === stepIdx ? "now" : "future";
          return (
            <li key={s.id} className={"ob-ss ob-ss-" + state} onClick={() => jumpTo(i)}>
              <span className="ob-ss-bub">
                {state === "done" ? <Icon name="check" size={13} /> : (i + 1)}
              </span>
              <div className="ob-ss-body">
                <div className="ob-ss-lbl">{s.label}</div>
                {state === "now"  && <div className="ob-ss-meta">In progress</div>}
                {state === "done" && <div className="ob-ss-meta ok">Done</div>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="ob-side-foot">
        <div className="ob-side-card">
          <div className="ob-side-card-row">
            <Avatar initials="PT" size={36} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Pim T.</div>
              <div className="muted" style={{ fontSize: 11 }}>Mochi POS · founder</div>
            </div>
          </div>
          <p className="ob-side-card-body">
            I'll personally check in with you within 24 hours of your first sale. Reply to any of my emails.
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 1 — Claim invite
// ─────────────────────────────────────────────────────────────────────────

function StepClaim({ ws, setWs, onNext, warmth }) {
  // Pretend the code was in the URL → pre-filled. User can edit if mistyped.
  const [code, setCode] = ouseState(ws.code);
  const [touched, setTouched] = ouseState(false);
  const valid = /^MOCHI-[A-Z]{3,4}-\d{4}$/.test(code);

  return (
    <div className="ob-pane ob-claim">
      <div className="ob-claim-grid">
        <div>
          <div className="eyebrow" style={{ color: "var(--lavender-700)" }}>You're in · {INVITE.tier}</div>
          <h1 className="ob-h1" style={{ marginTop: 8 }}>
            Welcome, {INVITE.ownerFirst}.
          </h1>
          <p className="ob-lede">
            We've reserved a workspace for <strong>{INVITE.brand}</strong>. Let's get you ready to sell — about 90 seconds.
          </p>

          <div className="ob-claim-card">
            <label className="ob-label">Your invite code</label>
            <p className="ob-help muted">Pulled from your email. Single-use — keeps the pilot doors closed to bots.</p>
            <div className={"ob-code-input" + (touched && !valid ? " invalid" : valid ? " valid" : "")}>
              <Icon name="ticket" size={18} />
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setWs(s => ({ ...s, code: e.target.value.toUpperCase() })); }}
                onBlur={() => setTouched(true)}
                placeholder="MOCHI-XXXX-2026"
                maxLength={16}
              />
              {valid && <span className="ob-code-ok"><Icon name="check" size={14} /> Verified</span>}
            </div>
          </div>

          <div className="ob-claim-actions">
            <button
              className="btn-primary lg"
              disabled={!valid}
              onClick={onNext}
            >
              Claim my workspace <Icon name="chev" size={16} />
            </button>
            <div className="ob-claim-already">
              Already have an account? <a href="#" onClick={(e) => e.preventDefault()}>Sign in</a>
            </div>
          </div>
        </div>

        <aside className="ob-welcome-aside">
          <div className="ob-welcome-note">
            <div className="ob-wn-from">
              <Avatar initials="PT" size={32} />
              <div>
                <div className="ob-wn-name">{INVITE.approvedBy}</div>
                <div className="muted" style={{ fontSize: 11 }}>Approved your application on May 7</div>
              </div>
            </div>
            <p className="ob-wn-body">{INVITE.approvedNote}</p>
          </div>

          <ul className="ob-perks">
            <li>
              <span className="ob-perk-icon ob-perk-1"><Icon name="shop" size={16} /></span>
              <div>
                <div className="ob-perk-h">Sell fast at the booth</div>
                <div className="ob-perk-d">Tap-and-charge POS · split payments · Send Later for custom orders</div>
              </div>
            </li>
            <li>
              <span className="ob-perk-icon ob-perk-2"><Icon name="user" size={16} /></span>
              <div>
                <div className="ob-perk-h">Build the relationship after</div>
                <div className="ob-perk-d">Customers register their pet on the QR receipt — you remember them next time</div>
              </div>
            </li>
            <li>
              <span className="ob-perk-icon ob-perk-3"><Icon name="pulse" size={16} /></span>
              <div>
                <div className="ob-perk-h">Know your numbers</div>
                <div className="ob-perk-d">Daily dashboard · hourly chart · low-stock alerts · margin by SKU</div>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 2 — Account
// ─────────────────────────────────────────────────────────────────────────

function StepAccount({ ws, setWs, onNext, onPrev }) {
  const [pw, setPw]   = ouseState(ws.password);
  const [pw2, setPw2] = ouseState(ws.passwordConfirm);
  const [agree, setAgree] = ouseState(false);
  const strength = pwStrength(pw);
  const match = pw && pw === pw2;
  const canNext = strength.score >= 2 && match && agree;

  const commit = () => {
    setWs(s => ({ ...s, password: pw, passwordConfirm: pw2 }));
    onNext();
  };

  return (
    <div className="ob-pane ob-form-step">
      <StepHead
        eyebrow="Step 2 of 6"
        title="Set up your account"
        sub="A few details to lock your workspace down. You can change everything later in Settings."
      />

      <div className="ob-form">
        <Field label="Login email" help="We'll send receipts, low-stock alerts, and the occasional founder note here.">
          <input className="ob-input" value={ws.email} readOnly />
        </Field>

        <Field label="Create password" help="At least 10 characters. We never see this.">
          <input
            className="ob-input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••••"
          />
          {pw && <PasswordStrength s={strength} />}
        </Field>

        <Field label="Confirm password">
          <input
            className={"ob-input" + (pw2 && !match ? " err" : "")}
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="••••••••••"
          />
          {pw2 && !match && <div className="ob-err">Doesn't match</div>}
          {pw2 && match && <div className="ob-ok"><Icon name="check" size={12} /> Matches</div>}
        </Field>

        <Field label="Phone (for 2-factor, optional)">
          <input
            className="ob-input"
            value={ws.phone}
            onChange={(e) => setWs(s => ({ ...s, phone: e.target.value }))}
            placeholder="+66 ..."
          />
        </Field>

        <div className="ob-fieldrow">
          <Field label="Country">
            <select className="ob-input" value={ws.country} onChange={(e) => setWs(s => ({ ...s, country: e.target.value }))}>
              <option>Thailand</option>
              <option>Singapore</option>
              <option>Malaysia</option>
              <option>Vietnam</option>
            </select>
          </Field>
          <Field label="Currency">
            <select className="ob-input" value={ws.currency} onChange={(e) => setWs(s => ({ ...s, currency: e.target.value }))}>
              <option value="THB">฿ Thai Baht (THB)</option>
              <option value="SGD">S$ Singapore Dollar</option>
              <option value="MYR">RM Malaysian Ringgit</option>
              <option value="VND">₫ Vietnamese Dong</option>
            </select>
          </Field>
        </div>

        <label className="ob-check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the <a href="#" onClick={(e) => e.preventDefault()}>pilot terms</a> and <a href="#" onClick={(e) => e.preventDefault()}>data handling policy</a>. We'll never share your sales data with other pilots.</span>
        </label>
      </div>

      <StepFoot onPrev={onPrev} onNext={commit} canNext={canNext} />
    </div>
  );
}

function PasswordStrength({ s }) {
  return (
    <div className="ob-strength">
      <div className="ob-strength-bars">
        {[0,1,2,3].map(i => (
          <div key={i} className={"ob-strength-bar" + (i <= s.score ? " on s-" + s.score : "")} />
        ))}
      </div>
      <span className="ob-strength-lbl">{s.label}</span>
    </div>
  );
}

function pwStrength(p) {
  let n = 0;
  if (p.length >= 10) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/[0-9]/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p)) n++;
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  return { score: Math.min(3, Math.max(0, n - 1)), label: labels[Math.min(4, n)] };
}

// ─────────────────────────────────────────────────────────────────────────
// Step 3 — Workspace
// ─────────────────────────────────────────────────────────────────────────

function StepWorkspace({ ws, setWs, onNext, onPrev }) {
  const subOk = /^[a-z0-9-]{3,32}$/.test(ws.subdomain);
  return (
    <div className="ob-pane ob-form-step">
      <StepHead
        eyebrow="Step 3 of 6"
        title="Confirm your workspace"
        sub="This is what'll appear on receipts and your customers' registration page. You can change it later."
      />

      <div className="ob-form">
        <Field label="Brand name" help="Shows on receipts, customer portal, and the dashboard.">
          <input className="ob-input" value={ws.brand} onChange={(e) => setWs(s => ({ ...s, brand: e.target.value }))} />
        </Field>

        <Field label="Workspace address">
          <div className="ob-subdomain">
            <input
              className={"ob-input ob-sub-input" + (!subOk ? " err" : "")}
              value={ws.subdomain}
              onChange={(e) => setWs(s => ({ ...s, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
              maxLength={32}
            />
            <span className="ob-sub-suffix">.mochipos.app</span>
          </div>
          <div className="ob-help muted">
            {subOk
              ? <><Icon name="check" size={12} /> Available — your customers register their pets at <strong>{ws.subdomain}.mochipos.app/me</strong></>
              : <>3–32 lowercase letters, numbers, or hyphens.</>
            }
          </div>
        </Field>

        <Field label="Booth profile" help="We use this to pre-set sensible defaults — change anything later.">
          <div className="ob-booth-grid">
            <BoothCard id="single"  cur={ws.boothType} setCur={(v) => setWs(s => ({ ...s, boothType: v }))} title="Single booth"  desc="One register, one cashier — most common."  meta="≤ 20 SKUs" />
            <BoothCard id="double"  cur={ws.boothType} setCur={(v) => setWs(s => ({ ...s, boothType: v }))} title="Double booth"  desc="Two cashiers at peak hours."           meta="20–60 SKUs" />
            <BoothCard id="popup"   cur={ws.boothType} setCur={(v) => setWs(s => ({ ...s, boothType: v }))} title="Pop-up tour"    desc="Frequent moves, small footprint."     meta="≤ 30 SKUs" />
          </div>
        </Field>

        <div className="ob-receipt-preview">
          <div className="ob-rp-eyebrow">Receipt preview</div>
          <div className="ob-receipt">
            <div className="ob-r-brand">{ws.brand || "Your brand"}</div>
            <div className="ob-r-sub">— sample receipt —</div>
            <div className="ob-r-line"></div>
            <div className="ob-r-row"><span>2 × Cat patch (medium)</span><span>฿380</span></div>
            <div className="ob-r-row"><span>1 × Iron-on sticker</span><span>฿90</span></div>
            <div className="ob-r-line"></div>
            <div className="ob-r-row ob-r-total"><span>Total</span><span>฿470</span></div>
            <div className="ob-r-foot">
              <div>Register your pet ↗</div>
              <div>{ws.subdomain || "yourbrand"}.mochipos.app/me</div>
            </div>
          </div>
        </div>
      </div>

      <StepFoot onPrev={onPrev} onNext={onNext} canNext={subOk && ws.brand.trim().length > 0} />
    </div>
  );
}

function BoothCard({ id, cur, setCur, title, desc, meta }) {
  return (
    <button className={"ob-booth-card" + (cur === id ? " on" : "")} onClick={() => setCur(id)}>
      <div className="ob-booth-title">{title}</div>
      <div className="ob-booth-desc">{desc}</div>
      <div className="ob-booth-meta">{meta}</div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 4 — Products
// ─────────────────────────────────────────────────────────────────────────

const PRESET_CATALOGS = {
  patches: {
    name: "Patches & embroidery",
    items: [
      { name: "Cat patch · medium",   price: 190, qty: 60, sku: "PCH-001" },
      { name: "Iron-on sticker pack", price:  90, qty: 80, sku: "PCH-002" },
      { name: "Embroidered keychain", price: 150, qty: 40, sku: "PCH-003" }
    ]
  },
  prints: {
    name: "Prints & illustration",
    items: [
      { name: "A4 print · 2-color riso", price: 250, qty: 40, sku: "PRT-001" },
      { name: "Postcard set (5)",         price: 180, qty: 60, sku: "PRT-002" },
      { name: "Zine · 16 pages",          price: 320, qty: 30, sku: "PRT-003" }
    ]
  },
  pet: {
    name: "Pet goods",
    items: [
      { name: "Handmade leather collar", price: 690, qty: 18, sku: "PET-001" },
      { name: "Catnip treat pouch",      price: 220, qty: 50, sku: "PET-002" },
      { name: "Ceramic food bowl",       price: 480, qty: 22, sku: "PET-003" }
    ]
  }
};

function StepProducts({ ws, setWs, onNext, onPrev }) {
  const [adding, setAdding]   = ouseState(false);
  const [draft, setDraft]     = ouseState({ name: "", price: "", qty: "" });

  const applyPreset = (id) => {
    const preset = PRESET_CATALOGS[id];
    setWs(s => ({ ...s, products: preset.items.map((p, i) => ({ ...p, id: id + "-" + i })) }));
  };

  const addDraft = () => {
    if (!draft.name.trim() || !draft.price) return;
    const id = "P-" + Date.now();
    const sku = "SKU-" + String(ws.products.length + 1).padStart(3, "0");
    setWs(s => ({ ...s, products: [...s.products, { id, sku, ...draft, price: Number(draft.price), qty: Number(draft.qty || 0) }] }));
    setDraft({ name: "", price: "", qty: "" });
    setAdding(false);
  };

  const remove = (id) => setWs(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));

  const count = ws.products.length;
  const canNext = count >= 1;

  return (
    <div className="ob-pane ob-form-step">
      <StepHead
        eyebrow="Step 4 of 6"
        title="Add your first products"
        sub="You need at least one to make a sale. Pick a starter catalog below or add your own — you'll polish images later."
      />

      {count === 0 && (
        <div className="ob-presets">
          <div className="ob-presets-lbl">Quick start with a catalog</div>
          <div className="ob-presets-grid">
            {Object.entries(PRESET_CATALOGS).map(([id, p]) => (
              <button key={id} className="ob-preset-card" onClick={() => applyPreset(id)}>
                <div className="ob-preset-h">{p.name}</div>
                <div className="ob-preset-d">Adds {p.items.length} placeholder products you can edit</div>
                <div className="ob-preset-items">
                  {p.items.map((it, i) => <div key={i}>· {it.name}</div>)}
                </div>
                <div className="ob-preset-cta">Use this catalog →</div>
              </button>
            ))}
          </div>
          <div className="ob-presets-or">— or —</div>
        </div>
      )}

      <div className="ob-products">
        {ws.products.map(p => (
          <div key={p.id} className="ob-prod-row">
            <div className="ob-prod-img"></div>
            <div className="ob-prod-info">
              <div className="ob-prod-name">{p.name}</div>
              <code className="ob-prod-sku">{p.sku}</code>
            </div>
            <div className="ob-prod-stat"><span className="num">{p.qty}</span><div>in stock</div></div>
            <div className="ob-prod-price num">฿{Number(p.price).toLocaleString()}</div>
            <button className="ob-prod-x" onClick={() => remove(p.id)}><Icon name="x" size={14} /></button>
          </div>
        ))}

        {adding && (
          <div className="ob-prod-row ob-prod-draft">
            <div className="ob-prod-img"></div>
            <input className="ob-input" placeholder="Product name" autoFocus value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
            <input className="ob-input ob-input-narrow" placeholder="Qty" type="number" value={draft.qty} onChange={(e) => setDraft(d => ({ ...d, qty: e.target.value }))} />
            <input className="ob-input ob-input-narrow" placeholder="฿ Price" type="number" value={draft.price} onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))} />
            <div className="ob-prod-draft-acts">
              <button className="btn-mini" onClick={() => { setAdding(false); setDraft({ name: "", price: "", qty: "" }); }}>Cancel</button>
              <button className="btn-mini primary" onClick={addDraft} disabled={!draft.name || !draft.price}>Add</button>
            </div>
          </div>
        )}

        {!adding && (
          <button className="ob-prod-add" onClick={() => setAdding(true)}>
            <span className="ob-prod-add-icon">+</span>
            <span>Add a product</span>
          </button>
        )}
      </div>

      <div className="ob-prod-summary">
        <strong>{count}</strong> {count === 1 ? "product" : "products"} ready
        {count > 0 && <> · ฿{ws.products.reduce((s, p) => s + Number(p.price) * Number(p.qty || 0), 0).toLocaleString()} retail value</>}
      </div>

      <StepFoot onPrev={onPrev} onNext={onNext} canNext={canNext} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 5 — Event
// ─────────────────────────────────────────────────────────────────────────

const SUGGESTED_EVENTS = [
  { name: "Pet Expo Thailand 2026",  venue: "BITEC Bangna",                  loc: "Bangkok",      start: "Jun 12",  end: "Jun 14",  booth: "B-24" },
  { name: "Bangkok Art Book Fair",    venue: "BACC",                          loc: "Bangkok",      start: "Jul 4",   end: "Jul 6",   booth: "—" },
  { name: "theMeowseum · Summer fair", venue: "Mochi gallery, Sukhumvit 26",  loc: "Bangkok",      start: "Aug 22",  end: "Aug 24",  booth: "A-12" }
];

function StepEvent({ ws, setWs, onNext, onPrev }) {
  const setEv = (k, v) => setWs(s => ({ ...s, event: { ...s.event, [k]: v } }));
  const canNext = ws.event.name.trim() && ws.event.startDate && ws.event.endDate;

  const pickSuggestion = (s) => {
    setWs(state => ({ ...state, event: {
      ...state.event,
      name: s.name, venue: s.venue, location: s.loc,
      startDate: s.start + ", 2026", endDate: s.end + ", 2026",
      boothNo: s.booth === "—" ? "" : s.booth
    }}));
  };

  return (
    <div className="ob-pane ob-form-step">
      <StepHead
        eyebrow="Step 5 of 6"
        title="Create your first event"
        sub="An event is a date range with a booth. All your stock allocates to it by default — you can split across events later."
      />

      <div className="ob-suggested">
        <div className="ob-suggested-lbl">Upcoming events we know about</div>
        <div className="ob-suggested-grid">
          {SUGGESTED_EVENTS.map((s, i) => (
            <button key={i} className="ob-sug-card" onClick={() => pickSuggestion(s)}>
              <div className="ob-sug-date">
                <div className="ob-sug-mon">{s.start.split(" ")[0]}</div>
                <div className="ob-sug-day">{s.start.split(" ")[1].replace(",", "")}</div>
              </div>
              <div className="ob-sug-body">
                <div className="ob-sug-name">{s.name}</div>
                <div className="ob-sug-meta">{s.venue} · {s.loc}</div>
                <div className="ob-sug-dates muted">{s.start} – {s.end}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="ob-form">
        <Field label="Event name">
          <input className="ob-input" value={ws.event.name} onChange={(e) => setEv("name", e.target.value)} placeholder="e.g. Pet Expo Thailand 2026" />
        </Field>

        <div className="ob-fieldrow">
          <Field label="Start date">
            <input className="ob-input" value={ws.event.startDate} onChange={(e) => setEv("startDate", e.target.value)} placeholder="Jun 12, 2026" />
          </Field>
          <Field label="End date">
            <input className="ob-input" value={ws.event.endDate} onChange={(e) => setEv("endDate", e.target.value)} placeholder="Jun 14, 2026" />
          </Field>
        </div>

        <div className="ob-fieldrow">
          <Field label="Venue">
            <input className="ob-input" value={ws.event.venue} onChange={(e) => setEv("venue", e.target.value)} placeholder="e.g. BITEC Bangna" />
          </Field>
          <Field label="Booth no.">
            <input className="ob-input" value={ws.event.boothNo} onChange={(e) => setEv("boothNo", e.target.value)} placeholder="B-24" />
          </Field>
        </div>

        <div className="ob-alloc-card">
          <div className="ob-alloc-h">
            <Icon name="info" size={16} /> Stock allocation
          </div>
          <p className="ob-alloc-body">
            We'll allocate all <strong>{ws.products.length}</strong> {ws.products.length === 1 ? "product" : "products"} ({ws.products.reduce((s, p) => s + Number(p.qty || 0), 0)} units) to <strong>{ws.event.name || "this event"}</strong>. You can split inventory across events later from <code>/events/[id]/stock</code>.
          </p>
        </div>
      </div>

      <StepFoot onPrev={onPrev} onNext={onNext} canNext={canNext} nextLabel="Finish setup" nextIcon="check" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Step 6 — Live!
// ─────────────────────────────────────────────────────────────────────────

function StepLive({ ws, warmth }) {
  return (
    <div className="ob-pane ob-live">
      <Confetti />

      <div className="ob-live-hero">
        {warmth !== "minimal" && (
          <div className="ob-live-mascot">
            <img src="assets/mochi-mascot.png" alt="" />
          </div>
        )}
        <div className="eyebrow" style={{ color: "var(--lavender-700)" }}>You're live</div>
        <h1 className="ob-h1" style={{ marginTop: 6, textAlign: "center" }}>
          {ws.brand} is open for business.
        </h1>
        <p className="ob-lede" style={{ textAlign: "center", maxWidth: 560, margin: "10px auto 0" }}>
          {ws.products.length} {ws.products.length === 1 ? "product" : "products"} ready · {ws.event.name || "first event"} configured · Send Later turned on by default.
        </p>

        <div className="ob-live-ws">
          <Icon name="link" size={14} />
          <span>{ws.subdomain}.mochipos.app</span>
          <button className="btn-mini"><Icon name="copy" size={11} /> Copy</button>
        </div>
      </div>

      <div className="ob-live-grid">
        <a className="ob-live-card primary" href="#" onClick={(e) => e.preventDefault()}>
          <div className="ob-live-icon"><Icon name="shop" size={20} /></div>
          <div>
            <div className="ob-live-h">Open the POS</div>
            <div className="ob-live-d">Make your first sale — even a test one counts.</div>
          </div>
          <Icon name="chev" size={16} />
        </a>
        <a className="ob-live-card" href="#" onClick={(e) => e.preventDefault()}>
          <div className="ob-live-icon"><Icon name="phone" size={20} /></div>
          <div>
            <div className="ob-live-h">Test on your phone</div>
            <div className="ob-live-d">Scan the QR · we'll send you a temporary booth link.</div>
          </div>
          <Icon name="chev" size={16} />
        </a>
        <a className="ob-live-card" href="#" onClick={(e) => e.preventDefault()}>
          <div className="ob-live-icon"><Icon name="tag" size={20} /></div>
          <div>
            <div className="ob-live-h">Polish your catalog</div>
            <div className="ob-live-d">Add photos, set reorder points, organize categories.</div>
          </div>
          <Icon name="chev" size={16} />
        </a>
        <a className="ob-live-card" href="#" onClick={(e) => e.preventDefault()}>
          <div className="ob-live-icon"><Icon name="user" size={20} /></div>
          <div>
            <div className="ob-live-h">See the customer portal</div>
            <div className="ob-live-d">Preview the QR receipt your customers will scan.</div>
          </div>
          <Icon name="chev" size={16} />
        </a>
      </div>

      <div className="ob-live-note">
        <div className="ob-wn-from">
          <Avatar initials="PT" size={32} />
          <div>
            <div className="ob-wn-name">Note from Pim</div>
            <div className="muted" style={{ fontSize: 11 }}>Founder · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          </div>
        </div>
        <p className="ob-wn-body">
          I'll be watching for your first sale. When it happens, I'll send a one-question email — just <em>"what worked, what didn't?"</em> — that's the whole pilot, really. Reply whenever.
        </p>
      </div>
    </div>
  );
}

function Confetti() {
  // 18 little drifting shapes via inline CSS animation
  const items = ouseMemo(() => {
    const colors = ["var(--lavender)", "var(--indigo)", "var(--cream-deep)", "var(--pink-blush)", "var(--lavender-700)"];
    return Array.from({ length: 18 }, (_, i) => ({
      left: (i * 5.5 + Math.random() * 3) + "%",
      delay: (Math.random() * 1.2).toFixed(2) + "s",
      dur: (3.5 + Math.random() * 2.5).toFixed(2) + "s",
      color: colors[i % colors.length],
      rot: Math.floor(Math.random() * 360),
      size: 6 + Math.floor(Math.random() * 6)
    }));
  }, []);
  return (
    <div className="ob-confetti">
      {items.map((c, i) => (
        <span key={i} className="ob-confetti-bit" style={{ left: c.left, animationDelay: c.delay, animationDuration: c.dur, background: c.color, transform: "rotate(" + c.rot + "deg)", width: c.size, height: c.size * 1.6 }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shared step bits
// ─────────────────────────────────────────────────────────────────────────

function StepHead({ eyebrow, title, sub }) {
  return (
    <div className="ob-step-head">
      <div className="eyebrow" style={{ color: "var(--lavender-700)" }}>{eyebrow}</div>
      <h1 className="ob-h1" style={{ marginTop: 8 }}>{title}</h1>
      <p className="ob-lede">{sub}</p>
    </div>
  );
}

function StepFoot({ onPrev, onNext, canNext, nextLabel = "Continue", nextIcon = "chev" }) {
  return (
    <div className="ob-step-foot">
      <button className="btn-ghost" onClick={onPrev}><Icon name="chev" size={14} style={{ transform: "scaleX(-1)" }} /> Back</button>
      <button className="btn-primary lg" disabled={!canNext} onClick={onNext}>
        {nextLabel} <Icon name={nextIcon} size={16} />
      </button>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div className="ob-field">
      <label className="ob-label">{label}</label>
      {help && <p className="ob-help muted">{help}</p>}
      {children}
    </div>
  );
}

Object.assign(window, { OnboardingApp });
