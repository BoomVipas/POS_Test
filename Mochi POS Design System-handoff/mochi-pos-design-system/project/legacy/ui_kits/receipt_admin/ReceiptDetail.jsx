/* global React */

function ReceiptDetail({ rec }) {
  if (!rec) return (
    <aside style={{ width: 340, padding: 20, color: "var(--muted)", fontSize: 13 }}>
      Select a receipt to view detail.
    </aside>
  );

  return (
    <aside style={{ width: 340, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        background: "var(--slip-bg)", borderRadius: 28,
        padding: "24px 22px", boxShadow: "var(--shadow-card)",
      }}>
        <div className="wordmark" style={{ alignItems: "center" }}>
          <span className="the" style={{ alignSelf: "center", textAlign: "center", width: "100%" }}>THE</span>
          <span className="meow" style={{ justifyContent: "center" }}>Meow</span>
          <span className="seum" style={{ textAlign: "center" }}>SEUM</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>
          Pet Expo · Day 0{rec.day} · {rec.time}
        </div>
        <hr style={{ border: "none", borderTop: "1.5px dashed var(--slip-line)", margin: "14px 0" }} />
        {rec.lines.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--text)" }}>{l.name} ×{l.qty}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>฿{(l.price * l.qty).toLocaleString()}</span>
          </div>
        ))}
        <hr style={{ border: "none", borderTop: "1.5px dashed var(--slip-line)", margin: "14px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
          <span>Total</span>
          <span style={{ fontVariantNumeric: "tabular-nums lining-nums", letterSpacing: "-.02em" }}>฿{rec.total.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
          <span>{rec.tender}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>฿{rec.received.toLocaleString()}</span>
        </div>
        <hr style={{ border: "none", borderTop: "1.5px dashed var(--slip-line)", margin: "14px 0" }} />
        <div style={{ textAlign: "center", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{rec.id}</div>
        <div style={{ textAlign: "center", fontSize: 14, marginTop: 6 }}>🐾</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={btn}>Reprint</button>
        <button style={{ ...btn, background: "var(--soft)", color: "var(--label)" }}>Email</button>
        <button style={{ ...btn, background: "transparent", color: "var(--danger)" }}>Void</button>
      </div>
    </aside>
  );
}

const btn = {
  flex: 1, border: "none", cursor: "pointer",
  background: "var(--grad-button)", color: "#fff",
  padding: "10px 0", borderRadius: 12,
  fontFamily: "inherit", fontWeight: 700, fontSize: 13,
  boxShadow: "var(--shadow-rest)",
};

window.ReceiptDetail = ReceiptDetail;
