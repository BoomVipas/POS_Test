/* global React */

function Header({ day, onDay }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 18,
      padding: "20px 28px",
      borderBottom: "1px solid var(--line)",
      background: "var(--panel)",
    }}>
      <img src="../../assets/mochi-mascot.png" alt="" style={{ height: 30 }} />
      <span className="wm" style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-.025em", color: "var(--indigo)" }}>
        Mochi<span style={{ color: "var(--lavender-700)" }}>POS</span>
      </span>
      <div style={{ width: 1, height: 22, background: "var(--line)" }} />
      <span className="eyebrow" style={{ color: "var(--muted)" }}>Receipt admin · Pet Expo · theMeowseum</span>
      <div style={{ flex: 1 }} />
      <select value={day} onChange={e => onDay(e.target.value)} style={{
        fontFamily: "inherit", fontSize: 13, padding: "8px 14px",
        background: "var(--panel)", border: "1px solid var(--line-strong)",
        borderRadius: 12, color: "var(--text)", outline: "none",
      }}>
        <option value="all">All days</option>
        <option value="1">Day 01 · May 04</option>
        <option value="2">Day 02 · May 05</option>
        <option value="3">Day 03 · May 06</option>
        <option value="4">Day 04 · May 07</option>
      </select>
      <button style={{
        background: "var(--grad-primary)", color: "#fff", border: "none",
        padding: "9px 18px", borderRadius: 12,
        fontFamily: "inherit", fontWeight: 800, fontSize: 13, cursor: "pointer",
        boxShadow: "var(--shadow-rest)",
      }}>Export CSV ↗</button>
    </header>
  );
}

window.AdminHeader = Header;
