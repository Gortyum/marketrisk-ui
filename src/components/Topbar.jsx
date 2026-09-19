export default function Topbar({ date, time, lastRun, statusChip, statusText, busy, onRun, toggle }) {
  return (
    <header className="topbar">
      <div>
        <h1>Market Risk Overview</h1>
      </div>
      <div className="header-right">
        <div className="clock"><div><span id="clockDate">{date}</span></div><div className="t" id="clockTime">{time}</div></div>
        <div>
          <div className="last-run"><span>LAST PIPELINE EXECUTION</span><b id="lastRun">{lastRun}</b></div>
        </div>
        <div className={statusChip} id="statusChip"><span className="dot" /><span id="statusText">{statusText}</span></div>
        <button className="theme-toggle" id="themeBtn" aria-label="Switch color theme" title="Toggle light / dark" onClick={toggle}>
          <svg className="t-moon" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12.4 9.6A5.4 5.4 0 0 1 5.4 2.6a5.4 5.4 0 1 0 7 7z" /></svg>
          <svg className="t-sun" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="2.6" /><path d="M7.5 1.5v1.4M7.5 12.1v1.4M1.5 7.5h1.4M12.1 7.5h1.4M3.2 3.2l1 1M10.8 10.8l1 1M11.8 3.2l-1 1M4.2 10.8l-1 1" /></svg>
        </button>
        <button className="btn-primary" id="runBtn" disabled={busy} onClick={onRun}>
          <span className="spin" aria-hidden="true" />
          <svg className="glyph" viewBox="0 0 14 14" fill="currentColor"><path d="M7.5 1.8 13 4.2l-5.5 2.4L2 4.2zM2.2 7.6l5.3 2.3 5.3-2.3M2.2 10l5.3 2.3 5.3-2.3" opacity=".55" /><path d="M7.5 1.8 13 4.2l-5.5 2.4L2 4.2z" fill="currentColor" opacity=".9" /></svg>
          Run pipeline
        </button>
      </div>
    </header>
  )
}