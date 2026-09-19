export default function Sidebar({ navActive, setNavActive, navEtl, envApi, envSchema, footVer }) {
  const items = [
    { g: 'Analytics', sel: 'top', label: 'Overview',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><rect x="1.5" y="1.5" width="5" height="5" /><rect x="8.5" y="1.5" width="5" height="5" /><rect x="1.5" y="8.5" width="5" height="5" /><rect x="8.5" y="8.5" width="5" height="5" /></svg> },
    { g: 'Analytics', sel: 'positions', label: 'Positions',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><path d="M7.6 1.8 13 4.5 7.6 7.2 2.2 4.5z" /><path d="M2.2 7.4l5.4 2.7 5.4-2.7" /><path d="M2.2 10.2l5.4 2.7 5.4-2.7" /></svg> },
    { g: 'Risk', sel: 'var', label: 'Market Risk',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><path d="M1.8 12.2 6 8l2.1 2.1L12.2 3.2" /><path d="M9.4 3.2H12.2v2.8" /></svg> },
    { g: 'Risk', sel: 'facts', label: 'Risk Factors',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><path d="M1.5 11h2.4l1-2.4 2.2 5 1.8-4.9 1 2.3h4.6" /></svg> },
    { g: 'Risk', sel: 'scen', label: 'Scenarios',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><circle cx="3.4" cy="10.4" r="1.6" /><circle cx="11.6" cy="10.4" r="1.6" /><path d="M3.4 8.8V5l-1.5 1M3.4 8.8c0-2.3 1.8-3.2 3-4.2M11.6 8.8V5l1.5 1M11.6 8.8c0-2.3-1.8-3.2-3-4.2" /></svg> },
    { g: 'Data', sel: 'etl', label: 'ETL Pipelines', count: navEtl,
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><path d="M12.8 5.6a5 5 0 0 0-8.6-1.1M2.2 9.4a5 5 0 0 0 8.6 1.1" /><path d="M3.4 2.2v3.9h3.9M11.6 12.8V8.9H7.7" /></svg> },
    { g: 'Data', sel: 'quality', label: 'Data Quality',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><path d="M7.5 1.7 13 3.5v4.1c0 3.1-2.2 5.2-5.5 6.4-3.3-1.2-5.5-3.3-5.5-6.4V3.5z" /><path d="M5.1 7.7 7 9.6 10.4 5.8" /></svg> },
    { g: 'System', sel: 'settings', label: 'Settings',
      icon: <svg className="nav-icon" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="2.2" /><path d="M7.5 1.8v2.1M7.5 11.1v2.1M1.8 7.5h2.1M11.1 7.5h2.1M3.5 3.5 5 5M10 10l1.5 1.5M11.5 3.5 10 5M5 10l-1.5 1.5" /></svg> }
  ]
  const groups = [...new Set(items.map(i => i.g))]
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <div>
          <div className="brand-name">MARKET RISK</div>
          <div className="brand-sub">analytics platform</div>
        </div>
      </div>

      <nav className="nav">
        {groups.map(g => (
          <div key={g} className="nav-group">
            <span className="nav-group-label">{g}</span>
            {items.filter(i => i.g === g).map(n => (
              <button key={n.sel} className={'nav-item' + (navActive === n.sel ? ' is-active' : '')}
                data-scroll={n.sel}
                onClick={() => {
                  setNavActive(n.sel)
                  if (n.sel === 'top') {
                    document.querySelector('.topbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  } else {
                    document.getElementById(n.sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}>
                {n.icon}<span>{n.label}</span>
                {n.count !== undefined && <span className="nav-count" id="navEtl">{n.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div>
        <div className="environment">
          <div className="env-title">Environment</div>
          <div className="env-row"><span>api</span><b id="envApi">{envApi}</b></div>
          <div className="env-row"><span>schema</span><b id="envSchema">{envSchema}</b></div>
        </div>
      </div>
    </aside>
  )
}