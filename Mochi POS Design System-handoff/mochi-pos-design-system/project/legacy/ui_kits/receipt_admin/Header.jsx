/* global React */

function Header({ day, onDay }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 22,
      padding: "20px 28px",
      borderBottom: "1px solid var(--line)",
      background: "var(--panel)",
    }}>
      <div className="wordmark" style={{ transform: "scale(.5)", transformOrigin: "left center", marginRight: -40 }}>
        <span className="the">THE</span>
        <span className="meow">Meow</span>
        <span className="seum">SEUM</span>
      </div>
      <span className="eyebrow" style={{ color: "var(--muted-warm)" }}>Receipt Admin</span>
      <div style={{ flex: 1 }} />
      <select value={day} onChange={e => onDay(e.target.value)} style={{
        fontFamily: "inherit", fontSize: 13, padding: "8px 14px",
        background: "var(--panel-strong)", border: "1px solid var(--line)",
        borderRadius: 12, color: "var(--text)", outline: "none",
      }}>
        <option value="all">All days</option>
        <option value="1">Day 01 · May 04</option>
        <option value="2">Day 02 · May 05</option>
        <option value="3">Day 03 · May 06</option>
        <option value="4">Day 04 · May 07</option>
      </select>
      <button style={{
        background: "var(--grad-button)", color: "#fff", border: "none",
        padding: "9px 18px", borderRadius: 12,
        fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer",
        boxShadow: "var(--shadow-rest)",
      }}>Export CSV ↗</button>
    </header>
  );
}

window.AdminHeader = Header;
