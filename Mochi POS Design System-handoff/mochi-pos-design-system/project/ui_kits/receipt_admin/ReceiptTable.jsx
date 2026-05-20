/* global React */

function ReceiptTable({ rows, selected, onSelect }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "var(--panel)", borderRadius: 20,
      boxShadow: "var(--shadow-card)", overflow: "hidden",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1.4fr) 1fr 1fr 80px 90px 110px",
        padding: "12px 18px",
        background: "var(--bg-soft)",
        borderBottom: "1px solid var(--line)",
        fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase",
        color: "var(--muted)",
      }}>
        <span>Receipt</span><span>Customer</span><span>Time</span><span>Items</span><span>Type</span><span style={{ textAlign: "right" }}>Total</span>
      </div>
      <div style={{ maxHeight: 460, overflowY: "auto" }}>
        {rows.map(r => {
          const sel = selected === r.id;
          return (
            <button key={r.id} onClick={() => onSelect(r.id)} style={{
              width: "100%", appearance: "none", border: "none",
              display: "grid",
              gridTemplateColumns: "minmax(0,1.4fr) 1fr 1fr 80px 90px 110px",
              padding: "12px 18px",
              background: sel ? "var(--indigo-50)" : "transparent",
              borderBottom: "1px solid var(--line-quiet)",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--text)",
              textAlign: "left", alignItems: "center",
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--indigo)" }}>{r.id}</span>
              <span>{r.customer}</span>
              <span style={{ color: "var(--muted)" }}>{r.time}</span>
              <span style={{ color: "var(--muted)" }}>{r.itemCount}</span>
              <span>
                {r.sendLater ? (
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, background: "var(--lavender-100)", color: "var(--lavender-700)", fontSize: 10, fontWeight: 800, letterSpacing: ".04em" }}>SEND LATER</span>
                ) : (
                  <span style={{ color: "var(--muted-soft)", fontSize: 11 }}>Take now</span>
                )}
              </span>
              <span style={{ textAlign: "right", fontWeight: 800, fontVariantNumeric: "tabular-nums lining-nums", letterSpacing: "-.02em" }}>฿{r.total.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.ReceiptTable = ReceiptTable;
