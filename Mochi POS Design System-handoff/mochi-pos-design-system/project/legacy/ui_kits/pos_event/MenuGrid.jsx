/* global React, PosAtoms */
const { Money } = PosAtoms;

function Tile({ p, onAdd }) {
  const out = p.stock === 0;
  const low = !out && p.stock <= 3;
  return (
    <button
      onClick={out ? undefined : () => onAdd(p)}
      style={{
        appearance: "none", border: "none", padding: 0, textAlign: "left",
        cursor: out ? "not-allowed" : "pointer",
        borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(180deg,var(--panel-strong) 0%,var(--panel-grad-bot) 100%)",
        boxShadow: "var(--shadow-card)",
        display: "flex", flexDirection: "column",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        opacity: out ? 0.7 : 1,
      }}
      onMouseEnter={e => !out && (e.currentTarget.style.boxShadow = "var(--shadow-pop)")}
      onMouseLeave={e => !out && (e.currentTarget.style.boxShadow = "var(--shadow-card)")}
    >
      <div style={{
        position: "relative", aspectRatio: "1", background: "var(--soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        filter: out ? "grayscale(.8) opacity(.55)" : "none",
      }}>
        <img src={`../../assets/products/${p.sku}.${p.ext || "png"}`} alt=""
             style={{ width: "100%", height: "100%", objectFit: "cover" }}
             onError={e => { e.target.style.display = "none"; }} />
        {(out || low) && (
          <span style={{
            position: "absolute", top: 8, left: 8,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 999,
            fontWeight: 800, fontSize: 10, letterSpacing: ".04em", textTransform: "uppercase",
            background: out ? "var(--danger-bg)" : "var(--warn-bg)",
            color:      out ? "var(--danger)"    : "var(--warn)",
          }}>{out ? "Sold out" : `${p.stock} left`}</span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: out ? "var(--muted)" : "var(--text)", lineHeight: 1.2 }}>
          {p.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)", fontWeight: 700 }}>
            {p.sku}
          </span>
          <Money value={p.price} />
        </div>
      </div>
    </button>
  );
}

function MenuGrid({ products, onAdd }) {
  return (
    <div style={{
      flex: 1, padding: "0 22px 22px", overflowY: "auto",
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
      alignContent: "start",
    }}>
      {products.map(p => <Tile key={p.sku} p={p} onAdd={onAdd} />)}
    </div>
  );
}

window.MenuGrid = MenuGrid;
window.Tile = Tile;
