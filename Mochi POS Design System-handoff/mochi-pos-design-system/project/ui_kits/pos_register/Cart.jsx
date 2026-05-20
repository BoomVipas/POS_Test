/* global React, PosAtoms */
const { Money, Button, Pill } = PosAtoms;

function CartRow({ line, onInc, onDec, onRemove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4, padding: "10px 0", borderBottom: "1px solid var(--line-quiet)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.25 }}>{line.name}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>
          SKU {line.sku} · <span style={{ fontFamily: "inherit" }}>฿{line.price}</span>
        </div>
      </div>
      <Money value={line.price * line.qty} />
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
        <button onClick={() => onDec(line.sku)} style={qtyBtn}>−</button>
        <span style={{ minWidth: 22, textAlign: "center", fontWeight: 800, fontSize: 13 }}>{line.qty}</span>
        <button onClick={() => onInc(line.sku)} style={qtyBtn}>+</button>
        <button onClick={() => onRemove(line.sku)} style={{ ...qtyBtn, marginLeft: "auto", color: "var(--danger)" }}>×</button>
      </div>
    </div>
  );
}

const qtyBtn = {
  width: 28, height: 28, borderRadius: 8, border: "none",
  background: "var(--bg-soft)", color: "var(--text)",
  fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer",
};

function Cart({ lines, customer, onCustomer, sendLater, onSendLater, onInc, onDec, onRemove, onClear, onCharge }) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <aside style={{
      width: 360, display: "flex", flexDirection: "column",
      background: "var(--panel-2)", borderLeft: "1px solid var(--line)",
    }}>
      <div style={{ padding: "16px 18px 10px" }}>
        <span className="eyebrow" style={{ color: "var(--muted)" }}>CART · {itemCount} items</span>
        <input value={customer} onChange={e => onCustomer(e.target.value)}
               style={{
                 width: "100%", marginTop: 6, padding: "8px 0",
                 border: "none", outline: "none", background: "transparent",
                 fontFamily: "inherit", fontSize: 18, fontWeight: 800,
                 color: "var(--text)", borderBottom: "1px solid var(--line-quiet)",
               }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
        {lines.length === 0 ? (
          <div style={{ padding: "60px 8px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>◌</div>
            Tap a product or scan to begin.
          </div>
        ) : lines.map(l => (
          <CartRow key={l.sku} line={l} onInc={onInc} onDec={onDec} onRemove={onRemove} />
        ))}
      </div>

      {lines.length > 0 && (
        <label style={{
          margin: "0 18px 12px", padding: "10px 12px",
          display: "flex", alignItems: "center", gap: 10,
          background: sendLater ? "var(--lavender-100)" : "var(--bg-soft)",
          borderRadius: 12, cursor: "pointer", fontSize: 12, fontWeight: 700,
          color: sendLater ? "var(--lavender-700)" : "var(--text)",
        }}>
          <input type="checkbox" checked={sendLater} onChange={e => onSendLater(e.target.checked)}
                 style={{ accentColor: "var(--indigo)" }} />
          <span>Send Later</span>
          <span style={{ fontWeight: 600, fontSize: 11, color: "var(--muted)" }}>· paid now, ship after event</span>
        </label>
      )}

      <div style={{ padding: "14px 18px 18px", borderTop: "1px solid var(--line)", background: "var(--panel)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--muted)", fontSize: 12 }}>
          <span>Subtotal</span><span style={{ fontVariantNumeric: "tabular-nums" }}>฿{subtotal.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "var(--muted)", fontSize: 12 }}>
          <span>Tax (incl.)</span><span>—</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>Total</span>
          <Money value={subtotal} size={28} weight={900} color="var(--text)" />
        </div>
        <Button variant="block" disabled={lines.length === 0} onClick={onCharge}>
          Charge ฿{subtotal.toLocaleString()}
        </Button>
        {lines.length > 0 && (
          <button onClick={onClear} style={{
            width: "100%", marginTop: 8, padding: "8px 0",
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--muted)", fontSize: 12, fontFamily: "inherit",
          }}>Clear cart</button>
        )}
      </div>
    </aside>
  );
}

window.Cart = Cart;
