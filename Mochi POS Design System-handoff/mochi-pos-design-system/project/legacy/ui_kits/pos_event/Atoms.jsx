/* global React */
const { useState } = React;

const Wordmark = ({ scale = 1 }) => (
  <div className="wordmark" style={{ transform: `scale(${scale})`, transformOrigin: "left top" }}>
    <span className="the">THE</span>
    <span className="meow">Meow</span>
    <span className="seum">SEUM</span>
  </div>
);

const Button = ({ variant = "primary", children, onClick, disabled, style }) => {
  const base = {
    fontFamily: "inherit", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", borderRadius: 14, padding: "12px 20px", fontSize: 14,
    transition: "transform 160ms ease, box-shadow 160ms ease, filter 160ms ease",
    opacity: disabled ? 0.55 : 1,
  };
  const variants = {
    primary: { background: "var(--grad-button)", color: "#fff", boxShadow: "var(--shadow-rest)" },
    secondary: { background: "var(--soft)", color: "var(--label)" },
    ghost: { background: "transparent", color: "var(--accent)" },
    danger: { background: "var(--severe)", color: "#fff" },
    block: { background: "var(--grad-button)", color: "#fff", padding: "16px 22px", fontSize: 16, borderRadius: 16, width: "100%", boxShadow: "var(--shadow-card)" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Pill = ({ tone = "neutral", children, style }) => {
  const tones = {
    success: { bg: "var(--success-bg)", fg: "var(--success)" },
    warn:    { bg: "var(--warn-bg)",    fg: "var(--warn)" },
    danger:  { bg: "var(--danger-bg)",  fg: "var(--danger)" },
    info:    { bg: "var(--info-bg)",    fg: "#3a4a8c" },
    neutral: { bg: "var(--soft)",       fg: "var(--label)" },
    solid:   { bg: "var(--accent-darker)", fg: "#fff" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px", borderRadius: 999,
      fontWeight: 800, fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase",
      background: tones.bg, color: tones.fg, ...style,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: tones.fg }} />
      {children}
    </span>
  );
};

const IconButton = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{
    width: 42, height: 42, borderRadius: 12, border: "none",
    background: "var(--panel)", boxShadow: "var(--shadow-rest)",
    color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 18, ...style,
  }}>{children}</button>
);

const Money = ({ value, size = 14, weight = 800, color = "var(--accent-strong)" }) => (
  <span style={{
    fontVariantNumeric: "tabular-nums lining-nums",
    letterSpacing: "-.02em", fontSize: size, fontWeight: weight, color,
  }}>฿{value.toLocaleString("en-US")}</span>
);

window.PosAtoms = { Wordmark, Button, Pill, IconButton, Money };
