/* global React */
const CATS = [
  { id: "all",     label: "All",       glyph: "▦" },
  { id: "sculpt",  label: "Sculpture", glyph: "◭" },
  { id: "paint",   label: "Painting",  glyph: "▤" },
  { id: "modern",  label: "Modern",    glyph: "◐" },
  { id: "sticker", label: "Stickers",  glyph: "✿" },
];

function Sidebar({ active, onSelect }) {
  return (
    <aside style={{
      width: 84, padding: "16px 10px",
      background: "var(--panel)", borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {CATS.map(c => {
        const sel = active === c.id;
        return (
          <button key={c.id} onClick={() => onSelect(c.id)} style={{
            border: "none", padding: "12px 6px",
            borderRadius: 14, cursor: "pointer",
            background: sel ? "var(--grad-button)" : "transparent",
            color: sel ? "#fff" : "var(--label)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "background 160ms ease",
            boxShadow: sel ? "var(--shadow-rest)" : "none",
          }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{c.glyph}</span>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}>{c.label}</span>
          </button>
        );
      })}
    </aside>
  );
}

window.Sidebar = Sidebar;
