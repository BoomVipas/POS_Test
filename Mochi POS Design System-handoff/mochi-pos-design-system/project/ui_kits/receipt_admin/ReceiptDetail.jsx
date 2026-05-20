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
        background: "var(--cream)", borderRadius: 28,
        padding: "24px 22px", boxShadow: "var(--shadow-card)",
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="../../assets/mochi-mascot.png" alt="" style={{ height: 40 }} />
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, letterSpacing: "-.025em", color: "var(--indigo)" }}>
            Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
          </div>
          <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: "var(--text)" }}>theMeowseum</div>
        </div>
        <div style={{ textAlign: "center", marginTop: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>
          Pet Expo · Day 0{rec.day} · {rec.time}
        </div>
        <hr style={{ border: "none", borderTop: "1.5px dashed var(--cream-deep)", margin: "14px 0" }} />
        {rec.lines.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "var(--text)" }}>{l.name} ×{l.qty}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>฿{(l.price * l.qty).toLocaleString()}</span>
          </div>
        ))}
        <hr style={{ border: "none", borderTop: "1.5px dashed var(--cream-deep)", margin: "14px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14 }}>
          <span>Total</span>
          <span style={{ fontVariantNumeric: "tabular-nums lining-nums", letterSpacing: "-.02em" }}>฿{rec.total.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
          <span>{rec.tender}</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>฿{rec.received.toLocaleString()}</span>
        </div>
        {rec.sendLater && (
          <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--lavender-100)", borderRadius: 10, fontSize: 11, color: "var(--lavender-700)", fontWeight: 700, textAlign: "center", letterSpacing: ".04em", textTransform: "uppercase" }}>
            Send Later · ships after event
          </div>
        )}
        <hr style={{ border: "none", borderTop: "1.5px dashed var(--cream-deep)", margin: "14px 0" }} />
        <div style={{ textAlign: "center", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{rec.id}</div>

        {/* QR for pet registration — the post-purchase moat */}
        <div style={{ marginTop: 10, padding: "12px", background: "var(--panel)", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8, background: "#1c1838",
            display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, padding: 4,
          }}>
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} style={{ background: ((i * 31 + 7) % 3) ? "transparent" : "#fff", borderRadius: 1 }} />
            ))}
          </div>
          <div style={{ flex: 1, fontSize: 11, lineHeight: 1.4, color: "var(--text)" }}>
            <div style={{ fontWeight: 800 }}>Register your pet</div>
            <div style={{ color: "var(--muted)" }}>Scan to save Mochi's profile + earn loyalty</div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 14, marginTop: 10 }}>🐾</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={btn}>Reprint</button>
        <button style={{ ...btn, background: "var(--bg-soft)", color: "var(--indigo)" }}>Email</button>
        <button style={{ ...btn, background: "transparent", color: "var(--danger)", boxShadow: "none" }}>Void</button>
      </div>
    </aside>
  );
}

const btn = {
  flex: 1, border: "none", cursor: "pointer",
  background: "var(--grad-primary)", color: "#fff",
  padding: "10px 0", borderRadius: 12,
  fontFamily: "inherit", fontWeight: 800, fontSize: 13,
  boxShadow: "var(--shadow-rest)",
};

window.ReceiptDetail = ReceiptDetail;
