import { useState } from 'react'
import { SEGMENTS, ENGINE_CONFIDENCE, ENGINE_HORIZON, fmtFull, fmtSigned } from '../lib/data.js'

export default function VarCenter({ engine, live, segment, setSegment, confidence, setConfidence, horizon, setHorizon }) {
  const [open, setOpen] = useState(false)
  const rate = (engine.calculation_time_ms / 1000).toFixed(2)
  const rows = [
    ['Historical observations', engine.n_observations.toLocaleString('en-US')],
    ['Confidence', confidence + '%'],
    ['Time horizon', horizon + 'D'],
    ['Portfolio value', fmtFull(engine.portfolio_value)],
    ['Risk factors', String(engine.n_factors)],
    ['Positions', String(engine.n_positions)],
    ['Calculation time', rate + 's']
  ]
  return (
    <section className="panel engine" id="risk" aria-label="Central risk engine">
      <div className="panel__head">
        <div>
          <div className="panel__eyebrow">central risk engine</div>
          <h2 className="panel__title">VaR + Expected Shortfall</h2>
          <p className="panel__sub">Historical simulation over aligned price history — open the calculation to see exactly where each number comes from.</p>
        </div>
        <button className="engine__toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          {open ? 'HIDE' : 'VIEW'} CALCULATION {open ? '▴' : '▾'}
        </button>
      </div>

      <div className="engine__controls">
        <div className="engine__group">
          <span className="engine__group-label">Portfolio</span>
          <div className="seg" role="group" aria-label="Portfolio segment">
            {SEGMENTS.map(s => (
              <button key={s.id} data-segment={s.id} aria-pressed={segment === s.id} onClick={() => setSegment(s.id)}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className="engine__group">
          <span className="engine__group-label">Confidence</span>
          <div className="seg" role="group" aria-label="Confidence level">
            {ENGINE_CONFIDENCE.map(c => (
              <button key={c} data-confidence={c} aria-pressed={confidence === c} onClick={() => setConfidence(c)}>{c}%</button>
            ))}
          </div>
        </div>
        <div className="engine__group">
          <span className="engine__group-label">Horizon</span>
          <div className="seg" role="group" aria-label="Time horizon">
            {ENGINE_HORIZON.map(h => (
              <button key={h} data-horizon={h} aria-pressed={horizon === h} onClick={() => setHorizon(h)}>{h}D</button>
            ))}
          </div>
        </div>
      </div>

      <div className="engine__readouts">
        <article className="readout readout--accent">
          <div className="readout__label">Value at Risk</div>
          <div className="readout__value" id="engineVar">{fmtFull(engine.var_value)}</div>
          <div className="readout__meta">
            <span className="chip chip--accent">{confidence}% / {horizon}D</span>
            <span className="chip">{live ? 'live engine' : 'demo engine'}</span>
          </div>
        </article>
        <article className="readout">
          <div className="readout__label">Expected Shortfall</div>
          <div className="readout__value" id="engineEs">{fmtFull(engine.expected_shortfall)}</div>
          <div className="readout__meta">
            <span className="chip">{'ES @ ' + confidence + '%'}</span>
            <span className="chip">{engine.n_positions} positions</span>
          </div>
        </article>
        <article className="readout readout--neg">
          <div className="readout__label">Worst Historical Loss</div>
          <div className="readout__value" id="engineWorst">{fmtSigned(-engine.worst_historical_loss)}</div>
          <div className="readout__meta">
            <span className="chip">{engine.n_observations.toLocaleString('en-US')} obs · max loss</span>
          </div>
        </article>
      </div>

      {open && (
        <div className="engine__calc" id="engineCalc">
          <div className="engine__calc-head">VaR Calculation <span className="bar" /> historical simulation</div>
          <div className="engine__calc-grid">
            {rows.map(([k, v]) => (
              <div className="calc-row" key={k}><span>{k}</span><b>{v}</b></div>
            ))}
          </div>
          <div className="engine__calc-foot">
            {live
              ? 'ES = mean loss beyond VaR · worst = max observed daily loss × √horizon — computed live by the risk engine from the price history in the database.'
              : 'demo engine — computed in the browser from the same seeded history the charts use (no live backend reachable). ES = mean loss beyond VaR · worst = max observed daily loss × √horizon.'}
          </div>
        </div>
      )}
    </section>
  )
}