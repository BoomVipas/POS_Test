// Applications app — list views + detail panel + filtering.

const { useState, useMemo, useEffect, useRef } = React;

// ── Main App ───────────────────────────────────────────────────────────────

function ApplicationsApp({ t, setTweak }) {
  // Stateful list (we mutate when approving/rejecting/requesting info)
  const [apps, setApps] = useState(() => SEED_APPLICATIONS);
  const [selectedId, setSelectedId] = useState(SEED_APPLICATIONS[0].id);
  const [filter, setFilter] = useState("inbox"); // inbox | new | reviewing | needs_info | approved | rejected | all
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("submitted"); // submitted | brand | events
  const [flow, setFlow] = useState(null);            // { kind: "approve" | "reject" | "info", id, step }
  const [toast, setToast] = useState(null);

  // Queue size tweak — slice the list
  const queueSize = t.queueSize;
  const displayApps = useMemo(() => apps.slice(0, queueSize), [apps, queueSize]);

  // Filtering + search
  const filtered = useMemo(() => {
    let out = displayApps;
    if (filter === "inbox") {
      out = out.filter(a => a.status === "new" || a.status === "reviewing" || a.status === "needs_info");
    } else if (filter !== "all") {
      out = out.filter(a => a.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(a =>
        a.brand.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    if (sortBy === "brand") out = [...out].sort((a, b) => a.brand.localeCompare(b.brand));
    if (sortBy === "events") out = [...out].sort((a, b) => b.expectedEvents - a.expectedEvents);
    return out;
  }, [displayApps, filter, search, sortBy]);

  // If selected falls outside filtered, pick first
  useEffect(() => {
    if (!filtered.find(a => a.id === selectedId) && filtered.length) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = apps.find(a => a.id === selectedId) || filtered[0];

  // Counts per filter
  const counts = useMemo(() => {
    const c = { inbox: 0, new: 0, reviewing: 0, needs_info: 0, approved: 0, rejected: 0, all: displayApps.length };
    displayApps.forEach(a => {
      c[a.status]++;
      if (a.status === "new" || a.status === "reviewing" || a.status === "needs_info") c.inbox++;
    });
    return c;
  }, [displayApps]);

  // Flow actions
  const openApprove = (id) => setFlow({ kind: "approve", id, step: "confirm" });
  const openReject  = (id) => setFlow({ kind: "reject",  id, step: "form" });
  const openInfo    = (id) => setFlow({ kind: "info",    id, step: "form" });
  const closeFlow   = () => setFlow(null);

  const showToast = (msg, tone = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3200);
  };

  // Commit approve — generates invite code from brand
  const commitApprove = (id, payload) => {
    setApps(prev => prev.map(a => {
      if (a.id !== id) return a;
      const code = "MOCHI-" + a.brand.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() + "-2026";
      const workspace = a.brand.toLowerCase().replace(/[^a-z0-9]/g, "") + ".mochipos.app";
      return {
        ...a,
        status: "approved",
        inviteCode: code,
        workspace,
        activity: [
          ...a.activity,
          { t: "now", date: "May 18", who: "You", what: "Approved · invite code " + code + " generated", kind: "approve" },
          { t: "now", date: "May 18", who: "System", what: "Invite email sent to " + a.email, kind: "email" }
        ]
      };
    }));
  };

  const commitReject = (id, reason) => {
    setApps(prev => prev.map(a => a.id !== id ? a : ({
      ...a,
      status: "rejected",
      activity: [...a.activity, { t: "now", date: "May 18", who: "You", what: "Rejected · " + reason, kind: "reject" }]
    })));
  };

  const commitInfo = (id, question) => {
    setApps(prev => prev.map(a => a.id !== id ? a : ({
      ...a,
      status: "needs_info",
      activity: [...a.activity, { t: "now", date: "May 18", who: "You", what: "Asked: " + question, kind: "info" }]
    })));
  };

  // Render
  const layout = t.layout;

  return (
    <Chrome>
      <div className={"apps-page density-" + t.density + " warmth-" + t.warmth}>

        <PageHeader counts={counts} brandWarmth={t.warmth} />

        <FilterBar
          filter={filter} setFilter={setFilter}
          counts={counts}
          search={search} setSearch={setSearch}
          sortBy={sortBy} setSortBy={setSortBy}
          layout={layout} setLayout={(v) => setTweak("layout", v)}
        />

        {layout === "split" && (
          <SplitView
            apps={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            selected={selected}
            onApprove={openApprove}
            onReject={openReject}
            onInfo={openInfo}
            warmth={t.warmth}
            density={t.density}
          />
        )}

        {layout === "table" && (
          <TableView
            apps={filtered}
            onSelect={(id) => { setSelectedId(id); }}
            selected={selected}
            onApprove={openApprove}
            onReject={openReject}
            onInfo={openInfo}
          />
        )}

        {layout === "kanban" && (
          <KanbanView
            apps={filtered.length ? filtered : displayApps}
            onSelect={setSelectedId}
            selectedId={selectedId}
            onApprove={openApprove}
            onReject={openReject}
            onInfo={openInfo}
          />
        )}

      </div>

      {/* Flow overlays */}
      {flow && flow.kind === "approve" && (
        <ApproveFlow
          app={apps.find(a => a.id === flow.id)}
          step={flow.step}
          setStep={(s) => setFlow(f => ({ ...f, step: s }))}
          onClose={closeFlow}
          onCommit={(payload) => {
            commitApprove(flow.id, payload);
            setFlow(f => ({ ...f, step: "success" }));
          }}
          onDone={() => {
            closeFlow();
            showToast("Approved & invite sent");
          }}
          warmth={t.warmth}
        />
      )}
      {flow && flow.kind === "reject" && (
        <RejectFlow
          app={apps.find(a => a.id === flow.id)}
          onClose={closeFlow}
          onCommit={(reason) => { commitReject(flow.id, reason); closeFlow(); showToast("Application rejected", "warn"); }}
        />
      )}
      {flow && flow.kind === "info" && (
        <InfoFlow
          app={apps.find(a => a.id === flow.id)}
          onClose={closeFlow}
          onCommit={(q) => { commitInfo(flow.id, q); closeFlow(); showToast("Question sent to applicant"); }}
        />
      )}

      {toast && <Toast {...toast} />}
    </Chrome>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────

function PageHeader({ counts, brandWarmth }) {
  const hot = counts.new + counts.reviewing;
  return (
    <div className="page-hd">
      <div>
        <div className="eyebrow">Platform admin · Pilot intake</div>
        <h1 style={{ marginTop: 6 }}>Applications</h1>
        <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
          {hot > 0
            ? <>You have <strong style={{ color: "var(--text)" }}>{counts.new} new</strong> and <strong style={{ color: "var(--text)" }}>{counts.reviewing} in review</strong>. Pilot cap is 20 — there's room for {Math.max(0, 20 - counts.approved)} more.</>
            : <>No new applications right now. Pilot cap is 20 — there's room for {Math.max(0, 20 - counts.approved)} more.</>
          }
        </p>
      </div>

      <div className="hd-right">
        <div className="hd-stat">
          <div className="hd-stat-v num">{counts.approved}</div>
          <div className="hd-stat-l">Approved pilots</div>
        </div>
        <div className="hd-stat hd-stat-cap">
          <div className="hd-cap-track">
            <div className="hd-cap-fill" style={{ width: (counts.approved / 20 * 100) + "%" }} />
          </div>
          <div className="hd-cap-lbl"><strong>{counts.approved}</strong> of 20 pilot slots</div>
        </div>
        {brandWarmth === "generous" && (
          <img src="assets/mochi-mascot.png" alt="" className="hd-mascot" />
        )}
      </div>
    </div>
  );
}

// ── Filter Bar ─────────────────────────────────────────────────────────────

function FilterBar({ filter, setFilter, counts, search, setSearch, sortBy, setSortBy, layout, setLayout }) {
  const TABS = [
    { id: "inbox",      label: "Inbox",      count: counts.inbox, badge: true },
    { id: "new",        label: "New",        count: counts.new },
    { id: "reviewing",  label: "Reviewing",  count: counts.reviewing },
    { id: "needs_info", label: "Needs info", count: counts.needs_info },
    { id: "approved",   label: "Approved",   count: counts.approved },
    { id: "rejected",   label: "Rejected",   count: counts.rejected },
    { id: "all",        label: "All",        count: counts.all }
  ];

  return (
    <div className="filterbar">
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={"tab" + (filter === tab.id ? " on" : "")}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={"tab-count" + (tab.badge && filter !== tab.id ? " hot" : "")}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="fb-right">
        <div className="search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search brand, owner, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch("")}><Icon name="x" size={14} /></button>}
        </div>

        <div className="seg-ctrl">
          <button className={sortBy === "submitted" ? "on" : ""} onClick={() => setSortBy("submitted")} title="Sort by date submitted">Newest</button>
          <button className={sortBy === "brand" ? "on" : ""} onClick={() => setSortBy("brand")} title="Sort by brand A–Z">A–Z</button>
          <button className={sortBy === "events" ? "on" : ""} onClick={() => setSortBy("events")} title="Sort by expected events">Volume</button>
        </div>

        <div className="layout-seg" title="View">
          <button className={layout === "split" ? "on" : ""} onClick={() => setLayout("split")}>
            <LayoutIcon name="split" /><span>Split</span>
          </button>
          <button className={layout === "table" ? "on" : ""} onClick={() => setLayout("table")}>
            <LayoutIcon name="table" /><span>Table</span>
          </button>
          <button className={layout === "kanban" ? "on" : ""} onClick={() => setLayout("kanban")}>
            <LayoutIcon name="kanban" /><span>Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function LayoutIcon({ name }) {
  const common = { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "split")  return (<svg {...common}><rect x="1.5" y="2" width="4" height="10" rx="1" /><rect x="7" y="2" width="5.5" height="10" rx="1" /></svg>);
  if (name === "table")  return (<svg {...common}><rect x="1.5" y="2" width="11" height="10" rx="1" /><path d="M1.5 5.5h11M1.5 9h11" /></svg>);
  if (name === "kanban") return (<svg {...common}><rect x="1.5" y="2" width="3" height="10" rx="1" /><rect x="5.5" y="2" width="3" height="10" rx="1" /><rect x="9.5" y="2" width="3" height="10" rx="1" /></svg>);
  return null;
}

// ── Split View (default) ───────────────────────────────────────────────────

function SplitView({ apps, selectedId, onSelect, selected, onApprove, onReject, onInfo, warmth, density }) {
  return (
    <div className="split">
      <div className="list-col">
        {apps.length === 0 && <EmptyList />}
        {apps.map(app => (
          <ListCard
            key={app.id}
            app={app}
            selected={app.id === selectedId}
            onClick={() => onSelect(app.id)}
            density={density}
          />
        ))}
      </div>

      <div className="detail-col">
        {selected && (
          <DetailPanel
            app={selected}
            onApprove={onApprove}
            onReject={onReject}
            onInfo={onInfo}
            warmth={warmth}
          />
        )}
      </div>
    </div>
  );
}

function ListCard({ app, selected, onClick, density }) {
  const meta = STATUS_META[app.status];
  return (
    <button className={"list-card" + (selected ? " on" : "")} onClick={onClick}>
      <div className="lc-head">
        <Avatar initials={app.initials} size={density === "compact" ? 32 : 36} />
        <div className="lc-id">
          <div className="lc-brand">{app.brand}</div>
          <div className="lc-meta">{app.owner} · {app.category}</div>
        </div>
        <StatusPill status={app.status} />
      </div>
      {density !== "compact" && (
        <div className="lc-body">
          <div className="lc-stat"><span>{app.expectedEvents}</span> events/yr</div>
          <div className="lc-stat"><span>{app.skuCount}</span> SKUs</div>
          <div className="lc-stat lc-loc">{app.location}</div>
        </div>
      )}
      <div className="lc-foot">
        <span className="lc-sub">{app.submitted}</span>
        <code className="lc-code">{app.id}</code>
      </div>
    </button>
  );
}

function EmptyList() {
  return (
    <div className="empty">
      <img src="assets/mochi-face.png" alt="" />
      <h3>Inbox zero</h3>
      <p>No applications match this filter.</p>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────

function DetailPanel({ app, onApprove, onReject, onInfo, warmth }) {
  const isResolved = app.status === "approved" || app.status === "rejected";
  return (
    <div className="detail">
      <div className="dp-head">
        <div className="dp-id">
          <Avatar initials={app.initials} size={56} />
          <div className="dp-id-text">
            <div className="dp-brand-row">
              <h2 style={{ fontSize: 24 }}>{app.brand}</h2>
              <StatusPill status={app.status} />
            </div>
            <div className="dp-sub">{app.ownerFull} · {app.category} · {app.location}</div>
            <div className="dp-id-line">
              <code>{app.id}</code>
              <span className="dp-dot">·</span>
              <span className="muted">Submitted {app.submitted}</span>
              <span className="dp-dot">·</span>
              <span className="muted">via {app.referral}</span>
            </div>
          </div>
        </div>

        {!isResolved && (
          <div className="dp-actions">
            <button className="btn-ghost" onClick={() => onInfo(app.id)}>
              <Icon name="info" size={16} /> Ask for info
            </button>
            <button className="btn-ghost danger" onClick={() => onReject(app.id)}>
              <Icon name="x" size={16} /> Reject
            </button>
            <button className="btn-primary" onClick={() => onApprove(app.id)}>
              <Icon name="check" size={16} /> Approve & invite
            </button>
          </div>
        )}
        {app.status === "approved" && (
          <div className="dp-approved-block">
            <div className="dp-approved-eyebrow">Approved · workspace active</div>
            <div className="dp-approved-code"><Icon name="ticket" size={16} />{app.inviteCode}</div>
            <div className="dp-approved-ws">{app.workspace}</div>
          </div>
        )}
        {app.status === "rejected" && (
          <div className="dp-rejected-block">
            <div className="dp-rejected-eyebrow">Rejected · no further action</div>
            <button className="btn-ghost" style={{ marginTop: 8 }}>Re-open application</button>
          </div>
        )}
      </div>

      <div className="dp-grid">
        <div className="dp-main">
          {/* Pitch */}
          <section className="dp-section">
            <div className="dp-section-h">
              <h4>About</h4>
            </div>
            <p className="dp-pitch">{app.pitch}</p>
          </section>

          {/* Activity timeline */}
          <section className="dp-section">
            <div className="dp-section-h">
              <h4>Activity</h4>
              <span className="muted" style={{ fontSize: 12 }}>{app.activity.length} events</span>
            </div>
            <ol className="timeline">
              {app.activity.slice().reverse().map((ev, i) => (
                <li key={i} className={"tl-row tl-" + ev.kind}>
                  <div className="tl-dot"><TLIcon kind={ev.kind} /></div>
                  <div className="tl-body">
                    <div className="tl-what">{ev.what}</div>
                    <div className="tl-meta">{ev.who} · {ev.date} · {ev.t}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="dp-side">
          {/* Contact */}
          <section className="dp-section dp-card">
            <div className="dp-section-h"><h4>Contact</h4></div>
            <ul className="kv">
              <li><Icon name="mail"  size={15} /><a href={"mailto:" + app.email}>{app.email}</a></li>
              <li><Icon name="phone" size={15} /><span>{app.phone}</span></li>
              <li><Icon name="line"  size={15} /><span>LINE {app.line}</span></li>
              <li><Icon name="instagram" size={15} /><span>{app.ig}</span></li>
            </ul>
          </section>

          {/* Booth profile */}
          <section className="dp-section dp-card">
            <div className="dp-section-h"><h4>Booth profile</h4></div>
            <ul className="kv">
              <li><Icon name="calendar" size={15} /><span>{app.expectedEvents} events / year</span></li>
              <li><Icon name="tag"      size={15} /><span>{app.skuCount} expected SKUs</span></li>
              <li><Icon name="spark"    size={15} /><span>{app.expectedRevenue}</span></li>
              <li><Icon name="user"     size={15} /><span>Pets: {app.pets}</span></li>
            </ul>
          </section>

          {/* Risk / signal — light heuristic */}
          <section className="dp-section dp-card dp-signal">
            <div className="dp-section-h">
              <h4>Pilot fit signal</h4>
              <span className={"fit-pill fit-" + fitScore(app).tone}>{fitScore(app).label}</span>
            </div>
            <ul className="signal-list">
              {fitScore(app).bullets.map((b, i) => (
                <li key={i} className={"sig-" + b.tone}>
                  <span className="sig-dot" />
                  {b.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function TLIcon({ kind }) {
  const map = { submit: "inbox", review: "spark", note: "pin", info: "info", approve: "check", email: "mail", redeem: "link", sale: "shop", reject: "x" };
  return <Icon name={map[kind] || "spark"} size={12} />;
}

function fitScore(app) {
  const bullets = [];
  let score = 0;
  if (app.expectedEvents >= 4 && app.expectedEvents <= 10) {
    bullets.push({ tone: "ok", text: app.expectedEvents + " events/yr — right cadence for pilot validation" });
    score++;
  } else if (app.expectedEvents > 10) {
    bullets.push({ tone: "warn", text: "Heavy event load (" + app.expectedEvents + "/yr) — may stress Send Later flow" });
  } else {
    bullets.push({ tone: "warn", text: "Low cadence (" + app.expectedEvents + "/yr) — slow signal" });
  }
  if (app.referral && app.referral !== "Direct" && app.referral !== "Google search") {
    bullets.push({ tone: "ok", text: "Referred by " + app.referral });
    score++;
  } else {
    bullets.push({ tone: "neutral", text: "Cold inbound (" + (app.referral || "Direct") + ")" });
  }
  if (app.skuCount >= 15 && app.skuCount <= 80) {
    bullets.push({ tone: "ok", text: app.skuCount + " SKUs — comfortable for product CRUD" });
    score++;
  } else if (app.skuCount > 80) {
    bullets.push({ tone: "warn", text: app.skuCount + " SKUs — heavy catalog, watch for friction" });
  } else {
    bullets.push({ tone: "neutral", text: app.skuCount + " SKUs — small catalog" });
  }
  let tone = "warn", label = "Worth a call";
  if (score >= 3) { tone = "ok";  label = "Strong fit"; }
  else if (score === 2) { tone = "info"; label = "Good fit"; }
  return { tone, label, bullets };
}

// ── Table View ────────────────────────────────────────────────────────────

function TableView({ apps, onSelect, selected, onApprove, onReject, onInfo }) {
  const [drawer, setDrawer] = useState(null); // app id

  return (
    <div className="table-wrap">
      <table className="apps-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}></th>
            <th>Brand</th>
            <th>Owner</th>
            <th>Category</th>
            <th className="num-th">Events</th>
            <th className="num-th">SKUs</th>
            <th>Status</th>
            <th>Submitted</th>
            <th style={{ width: 220 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apps.length === 0 && (
            <tr><td colSpan="9" style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>No applications match this filter.</td></tr>
          )}
          {apps.map(app => (
            <tr
              key={app.id}
              className={drawer === app.id ? "on" : ""}
              onClick={() => { onSelect(app.id); setDrawer(app.id); }}
            >
              <td><Avatar initials={app.initials} size={28} /></td>
              <td>
                <div style={{ fontWeight: 800 }}>{app.brand}</div>
                <code style={{ fontSize: 10 }}>{app.id}</code>
              </td>
              <td>{app.owner}</td>
              <td className="muted">{app.category}</td>
              <td className="num-td">{app.expectedEvents}</td>
              <td className="num-td">{app.skuCount}</td>
              <td><StatusPill status={app.status} /></td>
              <td className="muted">{app.submitted}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <div className="row-actions">
                  {app.status !== "approved" && app.status !== "rejected" && (
                    <>
                      <button className="btn-mini" onClick={() => onInfo(app.id)}>Info</button>
                      <button className="btn-mini danger" onClick={() => onReject(app.id)}>Reject</button>
                      <button className="btn-mini primary" onClick={() => onApprove(app.id)}><Icon name="check" size={12} />Approve</button>
                    </>
                  )}
                  {app.status === "approved" && <code className="tbl-code">{app.inviteCode}</code>}
                  {app.status === "rejected" && <span className="muted" style={{ fontSize: 12 }}>—</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {drawer && (() => {
        const app = apps.find(a => a.id === drawer);
        if (!app) return null;
        return (
          <div className="drawer-backdrop" onClick={() => setDrawer(null)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <button className="drawer-x" onClick={() => setDrawer(null)}><Icon name="x" /></button>
              <DetailPanel app={app} onApprove={onApprove} onReject={onReject} onInfo={onInfo} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Kanban View ───────────────────────────────────────────────────────────

function KanbanView({ apps, onSelect, selectedId, onApprove, onReject, onInfo }) {
  const cols = ["new", "reviewing", "needs_info", "approved", "rejected"];
  return (
    <div className="kanban">
      {cols.map(col => {
        const colApps = apps.filter(a => a.status === col);
        return (
          <div key={col} className="kb-col">
            <div className="kb-head">
              <span className="status-dot" style={{ background: STATUS_META[col].dot }} />
              <span className="kb-title">{STATUS_META[col].label}</span>
              <span className="kb-count">{colApps.length}</span>
            </div>
            <div className="kb-body">
              {colApps.length === 0 && <div className="kb-empty">—</div>}
              {colApps.map(app => (
                <button
                  key={app.id}
                  className={"kb-card" + (selectedId === app.id ? " on" : "")}
                  onClick={() => onSelect(app.id)}
                >
                  <div className="kb-card-hd">
                    <Avatar initials={app.initials} size={28} />
                    <div className="kb-card-id">
                      <div className="kb-brand">{app.brand}</div>
                      <div className="kb-owner">{app.owner}</div>
                    </div>
                  </div>
                  <div className="kb-card-cat">{app.category}</div>
                  <div className="kb-card-foot">
                    <span><strong>{app.expectedEvents}</strong> ev/yr</span>
                    <span><strong>{app.skuCount}</strong> SKUs</span>
                  </div>
                  {col === "approved" && (
                    <code className="kb-code">{app.inviteCode}</code>
                  )}
                  {(col === "new" || col === "reviewing" || col === "needs_info") && (
                    <div className="kb-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-mini" onClick={() => onInfo(app.id)}>Info</button>
                      <button className="btn-mini primary" onClick={() => onApprove(app.id)}>Approve</button>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────

function Toast({ msg, tone }) {
  return (
    <div className={"toast toast-" + tone}>
      <Icon name={tone === "ok" ? "check" : tone === "warn" ? "info" : "x"} size={16} />
      <span>{msg}</span>
    </div>
  );
}

Object.assign(window, { ApplicationsApp });
