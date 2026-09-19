export default function FactorPanel({ contrib, note }) {
  const max = Math.max(...contrib.map(x => x.pct), 0.001)
  return (
    <article className="panel" id="facts">
      <div className="panel__head">
        <div className="panel__title">Factor Contribution</div>
      </div>
      <div className="panel__body">
        <div id="contribList">
          {contrib.map(x => (
            <div key={x.label} className="crow">
              <div className="crow__lbl">{x.label}</div>
              <div className="crow__track"><div className={'crow__fill' + (x.hot ? ' is-hot' : '')} style={{ width: x.pct / max * 100 + '%' }} /></div>
              <div className="crow__val"><b>{x.val}</b><span>{x.pct.toFixed(1)}% of VaR</span></div>
            </div>
          ))}
        </div>
        <div className="contrib-note" id="contribNote">{note}</div>
      </div>
    </article>
  )
}