// Flow overlays — approve / reject / request-info.

const { useEffect: useEffect2, useState: useState2, useRef: useRef2 } = React;

// ── Approve flow ──────────────────────────────────────────────────────────
// step: "confirm" → "generating" → "success" (after onCommit)

function ApproveFlow({ app, step, setStep, onClose, onCommit, onDone, warmth }) {
  const [tier, setTier]   = useState2("standard"); // standard | priority
  const [notes, setNotes] = useState2("");
  const [send, setSend]   = useState2(true);  // also send email
  const [copied, setCopied] = useState2(false);

  if (!app) return null;

  // After clicking generate → run "generating" → call commit → success
  const start = () => {
    setStep("generating");
    setTimeout(() => onCommit({ tier, notes, send }), 1400);
  };

  const copyCode = () => {
    if (app.inviteCode) {
      // Best effort — preview iframe may not allow clipboard. Visual feedback either way.
      try { navigator.clipboard?.writeText(app.inviteCode); } catch (e) {}
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <Modal onClose={onClose} width={560} hideClose={step === "generating"}>
      {step === "confirm" && (
        <div className="approve">
          <div className="approve-eyebrow"><Icon name="check" size={14} /> Approve & invite</div>
          <h2 className="approve-h">Approve {app.brand}?</h2>
          <p className="muted approve-sub">
            We'll generate a single-use invite code and email it to <strong>{app.email}</strong>.
            They can redeem it to claim a workspace and start adding products.
          </p>

          <div className="approve-card">
            <div className="approve-card-row">
              <Avatar initials={app.initials} size={44} />
              <div>
                <div style={{ fontWeight: 800 }}>{app.brand}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{app.ownerFull} · {app.category}</div>
              </div>
              <StatusPill status={app.status} />
            </div>
            <div className="approve-card-grid">
              <div><div className="approve-k">Phone</div><div className="approve-v">{app.phone}</div></div>
              <div><div className="approve-k">LINE</div><div className="approve-v">{app.line}</div></div>
              <div><div className="approve-k">Expected events</div><div className="approve-v">{app.expectedEvents} / year</div></div>
              <div><div className="approve-k">Catalog</div><div className="approve-v">{app.skuCount} SKUs</div></div>
            </div>
          </div>

          <div className="approve-field">
            <label className="approve-label">Pilot tier</label>
            <div className="tier-grid">
              <button
                className={"tier-card" + (tier === "standard" ? " on" : "")}
                onClick={() => setTier("standard")}
              >
                <div className="tier-h">Standard pilot</div>
                <div className="tier-d">Full features · 90-day pilot window · standard support response</div>
                <div className="tier-meta"><span className="dot dot-info" /> 9 active</div>
              </button>
              <button
                className={"tier-card" + (tier === "priority" ? " on" : "")}
                onClick={() => setTier("priority")}
              >
                <div className="tier-h">Priority pilot</div>
                <div className="tier-d">Direct line to founder · weekly check-in · feedback loop</div>
                <div className="tier-meta"><span className="dot dot-warn" /> 2 active · 1 slot left</div>
              </button>
            </div>
          </div>

          <div className="approve-field">
            <label className="approve-label">
              Personal note <span className="muted" style={{ fontWeight: 600 }}>(optional, included in invite email)</span>
            </label>
            <textarea
              className="approve-textarea"
              rows="3"
              placeholder={`Hi ${app.owner.replace(/^Khun /, "")}, looking forward to having you in the pilot…`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <label className="approve-check">
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} />
            <span><strong>Send invite email immediately</strong> · otherwise we just generate the code for you to share manually</span>
          </label>

          <div className="approve-foot">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary lg" onClick={start}>
              <Icon name="check" size={16} /> Approve & generate code
            </button>
          </div>
        </div>
      )}

      {step === "generating" && (
        <div className="generating">
          <div className="gen-mascot">
            <img src="assets/mochi-mascot.png" alt="" />
            <div className="gen-spin"></div>
          </div>
          <h2 style={{ marginTop: 16, fontSize: 22 }}>Generating invite for {app.brand}…</h2>
          <ol className="gen-steps">
            <li className="done"><Icon name="check" size={12} /> Validating application</li>
            <li className="done"><Icon name="check" size={12} /> Reserving workspace subdomain</li>
            <li className="doing"><span className="gen-dot-spin" /> Minting single-use invite code</li>
            <li><span className="gen-dot" /> Sending email</li>
          </ol>
        </div>
      )}

      {step === "success" && (
        <div className="success">
          <div className="success-burst">
            <div className="success-ring" />
            <div className="success-check"><Icon name="check" size={28} /></div>
          </div>

          <h2 style={{ marginTop: 18, fontSize: 24, textAlign: "center" }}>
            {app.brand} is in 🎉
          </h2>
          <p className="muted" style={{ textAlign: "center", marginTop: 6 }}>
            Invite code generated and {send ? <>emailed to <strong>{app.email}</strong></> : "ready to share"}.
          </p>

          <div className="success-code-card">
            <div className="success-eyebrow">Single-use invite code · expires in 14 days</div>
            <div className="success-code-row">
              <code className="success-code">{app.inviteCode}</code>
              <button className={"btn-copy" + (copied ? " copied" : "")} onClick={copyCode}>
                {copied ? <><Icon name="check" size={14} /> Copied</> : <><Icon name="copy" size={14} /> Copy</>}
              </button>
            </div>
            <div className="success-ws">
              <Icon name="link" size={14} />
              Workspace reserved at <strong>{app.workspace}</strong>
            </div>
          </div>

          <div className="success-next">
            <div className="success-eyebrow">What happens next</div>
            <ol className="next-list">
              <li>
                <span className="next-bull">1</span>
                <div>
                  <strong>{app.owner.replace(/^Khun /, "")} gets an email</strong>
                  <div className="muted">From founder@mochipos.app — with the code and a "Claim your workspace" button.</div>
                </div>
              </li>
              <li>
                <span className="next-bull">2</span>
                <div>
                  <strong>They redeem the code</strong>
                  <div className="muted">Set password, confirm brand name & currency, land in first-run setup wizard.</div>
                </div>
              </li>
              <li>
                <span className="next-bull">3</span>
                <div>
                  <strong>You'll see them in Pilot status</strong>
                  <div className="muted">First sale lights up the dashboard — that's your "live" signal.</div>
                </div>
              </li>
            </ol>
          </div>

          <div className="approve-foot" style={{ marginTop: 20 }}>
            <button className="btn-ghost" onClick={onDone}>Back to applications</button>
            <button className="btn-primary lg" onClick={onDone}>
              <Icon name="mail" size={16} /> View invite email
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Reject flow ───────────────────────────────────────────────────────────

function RejectFlow({ app, onClose, onCommit }) {
  const [reason, setReason] = useState2("");
  const [preset, setPreset] = useState2("");
  const PRESETS = [
    "Not a fit — weekly market is outside our event-booth focus",
    "Pilot cap reached — added to waitlist for Q3",
    "Need more info on cold-chain / logistics before we can proceed",
    "Duplicate application"
  ];
  const final = preset || reason;
  return (
    <Modal onClose={onClose} width={520}>
      <div className="approve">
        <div className="approve-eyebrow danger"><Icon name="x" size={14} /> Reject application</div>
        <h2 className="approve-h">Reject {app.brand}?</h2>
        <p className="muted approve-sub">
          We'll send a polite decline to <strong>{app.email}</strong> and move them to the rejected list.
          They can re-apply in 90 days.
        </p>

        <div className="approve-field">
          <label className="approve-label">Reason (sent to applicant)</label>
          <div className="reject-presets">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                className={"reject-preset" + (preset === p ? " on" : "")}
                onClick={() => { setPreset(p); setReason(""); }}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            className="approve-textarea"
            rows="3"
            placeholder="Or write a custom reason…"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setPreset(""); }}
            style={{ marginTop: 12 }}
          />
        </div>

        <div className="approve-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger"
            disabled={!final}
            onClick={() => onCommit(final)}
          >
            <Icon name="x" size={16} /> Send decline
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Request more info flow ────────────────────────────────────────────────

function InfoFlow({ app, onClose, onCommit }) {
  const [q, setQ] = useState2("");
  const SUGGESTIONS = [
    "Can you share 2–3 photos of a recent booth setup?",
    "What's your average price point and AOV?",
    "How do you handle returns / customer service today?",
    "Which events are you booked for in the next 90 days?"
  ];
  return (
    <Modal onClose={onClose} width={520}>
      <div className="approve">
        <div className="approve-eyebrow info"><Icon name="info" size={14} /> Ask for more info</div>
        <h2 className="approve-h">Ask {app.owner.replace(/^Khun /, "")} a question</h2>
        <p className="muted approve-sub">
          Status moves to <strong>Needs info</strong>. They'll get an email and can reply directly.
        </p>

        <div className="approve-field">
          <label className="approve-label">Question</label>
          <div className="reject-presets">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="reject-preset" onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
          <textarea
            className="approve-textarea"
            rows="4"
            placeholder="Write a question…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ marginTop: 12 }}
            autoFocus
          />
        </div>

        <div className="approve-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!q.trim()} onClick={() => onCommit(q.trim())}>
            <Icon name="mail" size={16} /> Send question
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Generic Modal ─────────────────────────────────────────────────────────

function Modal({ children, onClose, width = 520, hideClose }) {
  useEffect2(() => {
    const onKey = (e) => { if (e.key === "Escape" && !hideClose) onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [hideClose, onClose]);

  return (
    <div className="modal-backdrop" onClick={hideClose ? null : onClose}>
      <div className="modal" style={{ width }} onClick={(e) => e.stopPropagation()}>
        {!hideClose && (
          <button className="modal-x" onClick={onClose}><Icon name="x" /></button>
        )}
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { ApproveFlow, RejectFlow, InfoFlow, Modal });
