import { fmtUsd } from '../lib/data.js'

export default function PositionsPanel({ positions, posSub, posCount, netVar }) {
  const mvc = Math.max(...positions.map(p => p.vc), 0.000001)
  const netMv = positions.reduce((a, p) => a + p.mv, 0)
  const pls = positions.map(p => p.pl).filter(v => v != null)
  const netPl = pls.length ? pls.reduce((a, b) => a + b, 0) : null
  return (
    <article className="panel" id="positions">
      <div className="panel__head">
        <div>
          <div className="panel__title">Positions</div>
          <div className="panel__sub" id="posSub">{posSub}</div>
        </div>
        <div className="status-chip"><span className="dot" /><span id="posCount">{posCount}</span></div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Current portfolio positions with risk metrics</caption>
          <thead>
            <tr>
              <th>Instrument</th><th>Asset Class</th><th>Quantity</th><th>Market Value</th><th>P&amp;L</th><th>Delta</th><th>Vega</th><th>VaR Contribution</th>
            </tr>
          </thead>
          <tbody id="posBody">
            {positions.map(p => {
              const plTxt = p.pl == null
                ? <span style={{ color: 'var(--muted-2)' }}>—</span>
                : <span className={p.pl < 0 ? 'neg' : 'pos'}>{p.pl < 0 ? '−' : '+'}{fmtUsd(Math.abs(p.pl))}</span>
              return (
                <tr key={p.sym}>
                  <td><div className="inst-sym">{p.sym}</div><div className="inst-name">{p.name}</div></td>
                  <td><span className="pill">{p.cls}</span></td>
                  <td className="numeric">{p.qty.toLocaleString('en-US')}</td>
                  <td className="numeric">{fmtUsd(p.mv)}</td>
                  <td className="numeric">{plTxt}</td>
                  <td className="numeric">{p.delta}</td>
                  <td className="numeric">{p.vega}</td>
                  <td className="numeric">
                    <span className="vc">
                      <span className="vc-bar"><span className="vc-fill" style={{ width: p.vc / mvc * 100 + '%' }} /></span>
                      <span className="vc-val">{fmtUsd(p.vc * 1e6)}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot id="posFoot">
            <tr>
              <td>Net</td><td /><td />
              <td className="numeric">{fmtUsd(netMv)}</td>
              <td className={'numeric' + (netPl != null && netPl < 0 ? ' neg' : '')}>
                {netPl == null ? '—' : (netPl < 0 ? '−' : '+') + fmtUsd(Math.abs(netPl))}
              </td>
              <td colSpan={2} />
              <td className="numeric neg">VaR 95% {fmtUsd(netVar * 1e6)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </article>
  )
}