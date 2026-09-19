export default function StressPanel({ items }) {
  return (
    <section className="mini" id="scen">
      <div className="mini__title">Stress Scenarios</div>
      <div style={{ marginTop: 8 }}>
        {items.map(s => (
          <div key={s.id} className="diag-row">
            <span>{s.label}</span>
            <b id={s.id} className={s.neg ? 'neg' : ''}>{s.val}</b>
          </div>
        ))}
      </div>
    </section>
  )
}