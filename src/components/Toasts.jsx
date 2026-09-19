export default function Toasts({ toasts }) {
  return (
    <div id="toasts" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={'toast' + (t.cls ? ' ' + t.cls : '')}>
          {t.msg} <span style={{ opacity: 0.5 }}>{t.time}</span>
        </div>
      ))}
    </div>
  )
}