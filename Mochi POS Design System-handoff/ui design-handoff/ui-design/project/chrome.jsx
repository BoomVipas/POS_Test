// Admin chrome — topbar + sidebar, matching the dashboard.html visual vocabulary.

function Chrome({ children, onOpenTweaks }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar onOpenTweaks={onOpenTweaks} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

function Sidebar() {
  // Admin nav — distinct from the seller-side nav. Note "Admin" eyebrow.
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <img src="assets/mochi-mascot.png" alt="" />
        <div>
          <span className="wm" style={{ fontSize: 18 }}>Mochi<span className="pos">POS</span></span>
          <div className="sb-eyebrow">Platform admin</div>
        </div>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">Pilots</div>
        <SBLink icon="inbox" label="Applications" count={6} active />
        <SBLink icon="ticket" label="Invite codes" count={4} />
        <SBLink icon="grid" label="Workspaces" count={11} />
        <SBLink icon="pulse" label="Pilot status" />

        <div className="sb-section" style={{ marginTop: 24 }}>System</div>
        <SBLink icon="scroll" label="Audit log" />
        <SBLink icon="bell" label="Notifications" count={2} />
        <SBLink icon="gear" label="Settings" />
      </nav>

      <div className="sb-foot">
        <div className="sb-foot-card">
          <div className="sb-foot-row">
            <span className="dot dot-ok"></span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 12 }}>All pilots healthy</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>11 active · 0 alerts</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SBLink({ icon, label, count, active }) {
  return (
    <a className={"sb-link" + (active ? " on" : "")} href="#" onClick={(e) => e.preventDefault()}>
      <Icon name={icon} />
      <span>{label}</span>
      {count != null && <span className="sb-count">{count}</span>}
    </a>
  );
}

function Topbar({ onOpenTweaks }) {
  return (
    <header className="topbar">
      <div className="crumbs">
        <span className="crumb-muted">Platform admin</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-now">Applications</span>
      </div>
      <div className="top-actions">
        <span className="pill ok" title="Last sync"><span className="dot dot-ok" />Synced · 12s ago</span>
        <button className="topbtn" title="Notifications"><Icon name="bell" /></button>
        <button className="topbtn" title="Help"><Icon name="help" /></button>
        <div className="me" title="Platform admin">PT</div>
      </div>
    </header>
  );
}

// ── Inline SVG icons — stroke 1.75, 20px, matching DS guide ───────────────
function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "inbox":   return (<svg {...s}><path d="M3 13l3-8h12l3 8" /><path d="M3 13v6h18v-6" /><path d="M3 13h5l1 2h6l1-2h5" /></svg>);
    case "ticket":  return (<svg {...s}><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 100 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1a2 2 0 100-4V9z" /><path d="M13 7v10" strokeDasharray="2 2" /></svg>);
    case "grid":    return (<svg {...s}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
    case "pulse":   return (<svg {...s}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>);
    case "scroll":  return (<svg {...s}><path d="M5 5h12a2 2 0 012 2v10a2 2 0 002 2H7a2 2 0 01-2-2V5z" /><path d="M8 9h6M8 13h6" /></svg>);
    case "bell":    return (<svg {...s}><path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5L6 16z" /><path d="M10 20a2 2 0 004 0" /></svg>);
    case "gear":    return (<svg {...s}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2L5 5.8 3 9.2l2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" /></svg>);
    case "help":    return (<svg {...s}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>);
    case "search":  return (<svg {...s}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
    case "check":   return (<svg {...s}><path d="M4 12l5 5L20 6" /></svg>);
    case "x":       return (<svg {...s}><path d="M6 6l12 12M18 6L6 18" /></svg>);
    case "info":    return (<svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M11.5 12h.5v5h.5" /></svg>);
    case "copy":    return (<svg {...s}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></svg>);
    case "mail":    return (<svg {...s}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg>);
    case "phone":   return (<svg {...s}><path d="M5 4h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>);
    case "link":    return (<svg {...s}><path d="M10 14a4 4 0 015.7 0l3-3a4 4 0 10-5.7-5.7l-1.5 1.5" /><path d="M14 10a4 4 0 01-5.7 0l-3 3a4 4 0 105.7 5.7l1.5-1.5" /></svg>);
    case "chev":    return (<svg {...s}><path d="M9 6l6 6-6 6" /></svg>);
    case "filter":  return (<svg {...s}><path d="M3 5h18M6 12h12M10 19h4" /></svg>);
    case "sort":    return (<svg {...s}><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" /></svg>);
    case "pin":     return (<svg {...s}><path d="M12 17v5M9 4h6l-1 5 3 3H7l3-3-1-5z" /></svg>);
    case "shop":    return (<svg {...s}><path d="M3 8l1.5-3h15L21 8" /><path d="M3 8v11a1 1 0 001 1h16a1 1 0 001-1V8" /><path d="M3 8h18M9 12v4M15 12v4" /></svg>);
    case "calendar":return (<svg {...s}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
    case "user":    return (<svg {...s}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>);
    case "tag":     return (<svg {...s}><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /></svg>);
    case "instagram": return (<svg {...s}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></svg>);
    case "line":    return (<svg {...s}><path d="M4 11c0-4 3.6-7 8-7s8 3 8 7-3.6 7-8 7c-.7 0-1.4-.1-2-.2L6 20l1.4-3.6A6.7 6.7 0 014 11z" /></svg>);
    case "spark":   return (<svg {...s}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" /></svg>);
    case "tweaks":  return (<svg {...s}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><path d="M8 6h12M4 12h12M8 18h12" /></svg>);
    default:        return null;
  }
}

// ── Pill / Avatar atoms ────────────────────────────────────────────────────

function StatusPill({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className={"pill " + meta.tone} style={{ paddingLeft: 8 }}>
      <span className="status-dot" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

function Avatar({ initials, size = 36 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {initials}
    </div>
  );
}

Object.assign(window, { Chrome, Icon, StatusPill, Avatar });
