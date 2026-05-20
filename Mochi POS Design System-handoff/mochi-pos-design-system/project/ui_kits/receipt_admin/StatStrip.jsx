/* global React */

function StatStrip({ stats }) {
  const items = [
    { label: "Sales today",  value: `฿${stats.sales.toLocaleString()}`, hint: `${stats.txCount} transactions` },
    { label: "Items sold",   value: stats.items.toLocaleString(),       hint: `Top: ${stats.topName}` },
    { label: "Average sale", value: `฿${stats.avg.toLocaleString()}`,   hint: "Day 02 of 04" },
    { label: "Send Later",   value: stats.sendLater,                    hint: "Ship after event" },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
      padding: "20px 28px",
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: "16px 18px", borderRadius: 20,
          background: "var(--panel)",
          boxShadow: "var(--shadow-card)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{it.label}</div>
          <div style={{ marginTop: 6, fontSize: 26, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums lining-nums", letterSpacing: "-.02em" }}>{it.value}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>{it.hint}</div>
        </div>
      ))}
    </div>
  );
}

window.StatStrip = StatStrip;
