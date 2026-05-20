/* global React, PosAtoms */
const { useState } = React;
const { Button, Money } = PosAtoms;

const TENDERS = [
  { id: "cash",   label: "Cash",         glyph: "฿" },
  { id: "qr",     label: "QR PromptPay", glyph: "▦" },
  { id: "card",   label: "Card",         glyph: "▭" },
];

function ChargeModal({ open, total, onClose, onConfirm }) {
  const [tender, setTender] = useState("qr");
  const [received, setReceived] = useState(total);
  if (!open) return null;
  const change = Math.max(0, received - total);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(28,24,56,.42)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fade 180ms ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, background: "var(--panel)", borderRadius: 32,
        boxShadow: "var(--shadow-pop)", padding: 28,
      }}>
        <span className="eyebrow" style={{ color: "var(--muted)" }}>Charge</span>
        <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 12 }}>
          <Money value={total} size={36} weight={900} color="var(--text)" />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>due</span>
        </div>

        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {TENDERS.map(t => {
            const sel = tender === t.id;
            return (
              <button key={t.id} onClick={() => setTender(t.id)} style={{
                border: "none", padding: "16px 8px", borderRadius: 16,
                background: sel ? "var(--grad-primary)" : "var(--bg-soft)",
                color:      sel ? "#fff" : "var(--text)",
                fontFamily: "inherit", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                boxShadow: sel ? "var(--shadow-rest)" : "none",
                transition: "background 160ms ease",
              }}>
                <span style={{ fontSize: 22 }}>{t.glyph}</span>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".04em" }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {tender === "cash" && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>Cash received</label>
            <input
              type="number"
              value={received}
              onChange={e => setReceived(Number(e.target.value) || 0)}
              style={{
                fontFamily: "inherit", fontSize: 22, fontWeight: 800,
                background: "var(--panel)", border: "1px solid var(--line-strong)",
                borderRadius: 14, padding: "12px 16px", outline: "none",
                color: "var(--text)", fontVariantNumeric: "tabular-nums",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              <span>Change</span>
              <Money value={change} size={16} weight={800} color="var(--text)" />
            </div>
          </div>
        )}

        <div style={{
          marginTop: 18, padding: "10px 12px", background: "var(--lavender-100)",
          borderRadius: 12, fontSize: 12, color: "var(--lavender-700)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>🐾</span>
          <span>Receipt will include QR for customer to register their pet later.</span>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button
            variant="primary"
            disabled={tender === "cash" && received < total}
            onClick={() => onConfirm(tender, received)}
            style={{ flex: 2 }}
          >
            Confirm payment
          </Button>
        </div>
      </div>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function ReceiptToast({ open, txid, onDone }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", right: 24, bottom: 24, zIndex: 60,
      background: "var(--panel)", borderRadius: 20,
      padding: "14px 18px", boxShadow: "var(--shadow-pop)",
      display: "flex", alignItems: "center", gap: 12,
      animation: "slidein 240ms ease",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--success-bg)", color: "var(--success)", display: "grid", placeItems: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Sale recorded</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{txid}</div>
      </div>
      <button onClick={onDone} style={{ marginLeft: 8, background: "transparent", border: "none", color: "var(--muted)", fontSize: 18, cursor: "pointer" }}>×</button>
      <style>{`@keyframes slidein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

window.ChargeModal = ChargeModal;
window.ReceiptToast = ReceiptToast;
