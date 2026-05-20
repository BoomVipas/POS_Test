/* global React, PosAtoms */
const { IconButton } = PosAtoms;

function Toolbar({ query, onQuery, onScan }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 22px",
    }}>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", gap: 10,
        background: "var(--panel-strong)", borderRadius: 14,
        border: "1px solid var(--line)", padding: "10px 16px",
        boxShadow: "var(--shadow-rest)",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>
        </svg>
        <input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Search products or scan barcode…"
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: "inherit", fontSize: 14, color: "var(--text)",
          }}
        />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>
          {query ? `${query.length} chars` : ""}
        </span>
      </div>
      <IconButton onClick={onScan} style={{ width: 46, height: 46, borderRadius: 14 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M3 6v12M7 6v12M11 6v12M15 6v12M19 6v12"/>
        </svg>
      </IconButton>
    </div>
  );
}

window.Toolbar = Toolbar;
