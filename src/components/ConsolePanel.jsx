import { useEffect, useRef } from 'react'

export default function ConsolePanel({ logs, onClear }) {
  const box = useRef(null)
  useEffect(() => {
    const el = box.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])
  return (
    <article className="panel console" id="run">
      <div className="panel__head">
        <div className="panel__title">Pipeline Console</div>
        <button className="console-clear" onClick={onClear}>clear</button>
      </div>
      <div className="console-body" ref={box} role="log" aria-live="polite">
        {logs.length === 0 && <div className="con-line sys"><span className="con-time">--</span>no output</div>}
        {logs.map(l => (
          <div key={l.id} className={'con-line' + (l.kind ? ' ' + l.kind : '')}>
            <span className="con-time">{l.t}</span>{l.text}
          </div>
        ))}
      </div>
    </article>
  )
}