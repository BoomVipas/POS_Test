/* global React */
const { useState } = React;

const Wordmark = ({ scale = 1 }) => (
  <span className="wm" style={{
    fontSize: 20 * scale, fontWeight: 900, letterSpacing: "-.025em",
    display: "inline-flex", alignItems: "baseline", gap: 0,
  }}>
    Mochi<span className="pos" style={{ color: "var(--lavender-700)" }}>POS</span>
  </span>
);

const MascotMark = ({ size = 28 }) => (
  <img src="../../assets/mochi-mascot.png" alt="" style={{ height: size, width: "auto" }} />
);

const Button = ({ variant = "primary", children, onClick, disabled, style }) => {
  const base = {
    fontFamily: "inherit", fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", borderRadius: 14, padding: "12px 20px", fontSize: 14,
    transition: "transform 160ms ease, box-shadow 160ms ease, filter 160ms ease",
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary:   { background: "var(--grad-primary)", color: "#fff", boxShadow: "var(--shadow-rest)" },
    secondary: { background: "var(--bg-soft)", color: "var(--indigo)" },
    ghost:     { background: "transparent", color: "var(--indigo)" },
    danger:    { background: "var(--danger)", color: "#fff" },
    block:     { background: "var(--grad-primary)", color: "#fff", padding: "16px 22px", fontSize: 16, borderRadius: 16, width: "100%", boxShadow: "var(--shadow-card)" },
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
    info:    { bg: "var(--info-bg)",    fg: "var(--info)" },
    neutral: { bg: "var(--bg-soft)",    fg: "var(--text)" },
    solid:   { bg: "var(--indigo)",     fg: "#fff" },
    lav:     { bg: "var(--lavender-100)", fg: "var(--lavender-700)" },
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
    color: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 18, ...style,
  }}>{children}</button>
);

const Money = ({ value, size = 14, weight = 800, color = "var(--indigo)" }) => (
  <span style={{
    fontVariantNumeric: "tabular-nums lining-nums",
    letterSpacing: "-.02em", fontSize: size, fontWeight: weight, color,
  }}>฿{value.toLocaleString("en-US")}</span>
);

window.PosAtoms = { Wordmark, MascotMark, Button, Pill, IconButton, Money };
