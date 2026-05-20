/* global React, PosAtoms */
const { Wordmark, MascotMark, Pill } = PosAtoms;

const DAYS = [
  { id: 1, label: "DAY 01", date: "May 04" },
  { id: 2, label: "DAY 02", date: "May 05" },
  { id: 3, label: "DAY 03", date: "May 06" },
  { id: 4, label: "DAY 04", date: "May 07" },
];

function Topbar({ activeDay, onDayChange, syncCount }) {
  return (
    <header style={{
      height: 64, padding: "0 22px",
      display: "flex", alignItems: "center", gap: 22,
      background: "var(--panel)", borderBottom: "1px solid var(--line)",
      boxShadow: "0 1px 0 rgba(28,24,56,.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MascotMark size={32} />
        <Wordmark scale={0.95} />
      </div>
      <div style={{ width: 1, height: 24, background: "var(--line)" }} />
      <span className="eyebrow" style={{ color: "var(--muted)" }}>Pet Expo · Booth A14 · theMeowseum</span>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 6 }}>
        {DAYS.map(d => (
          <button key={d.id} onClick={() => onDayChange(d.id)} style={{
            border: "none", padding: "6px 12px", borderRadius: 999,
            fontSize: 12, fontWeight: 800, letterSpacing: ".04em", cursor: "pointer",
            fontFamily: "inherit",
            background: activeDay === d.id ? "var(--indigo)" : "var(--bg-soft)",
            color: activeDay === d.id ? "#fff" : "var(--text)",
            transition: "background 160ms ease",
          }}>
            <span>{d.label}</span>
            <span style={{ opacity: .65, marginLeft: 6, fontWeight: 600 }}>{d.date}</span>
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 24, background: "var(--line)" }} />
      <Pill tone={syncCount > 0 ? "info" : "success"}>
        {syncCount > 0 ? `Pending sync · ${syncCount}` : "All synced"}
      </Pill>
    </header>
  );
}

window.Topbar = Topbar;
