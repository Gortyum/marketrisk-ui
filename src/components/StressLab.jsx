import { STRESS_PRESETS, CUSTOM_CLASSES, pctOf, fmtFull, fmtSigned } from '../lib/data.js'

export default function StressLab({ live, stressRes, presetId, setPresetId, custom, setCustom, onRun, confidence, horizon }) {
  const setPct = (c, v) => {
    const n = Number.isFinite(v) ? Math.max(-100, Math.min(100, v)) / 100 : 0
    setCustom({ ...custom, [c]: n })
  }
  const active = stressRes && stressRes.el ? stressRes.el : null
  const cls = active ? active.cls : (STRESS_PRESETS.find(p => p.id === presetId) || {}).cls || {}
  const shocks = Object.keys(cls).filter(c => cls[c] !== 0)

  return (
    <section className="panel stresslab" id="stress" aria-label="Stress testing lab">
      <div className="panel__head">
        <div>
          <div className="panel__eyebrow">scenario lab</div>
          <h2 className="panel__title">Stress Testing</h2>
          <p className="panel__sub">Shock a class of risk (or build a custom mix) and see the book re-marked against the stress distribution — P&L and VaR are computed the same way as the central engine.</p>
        </div>
      </div>

      <div className="stresslab__controls">
        <div className="stresslab__presets" role="group" aria-label="Stress presets">
          {STRESS_PRESETS.map(p => (
            <button
              key={p.id}
              className="preset-btn"
              aria-pressed={presetId === p.id}
              onClick={() => { setPresetId(p.id); setCustom(c => ({ ...c })) }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {presetId === 'custom' && (
          <div className="stresslab__custom" id="customShocks">
            <span className="engine__group-label">Custom shocks per class</span>
            <div className="stresslab__inputs">
              {CUSTOM_CLASSES.map(c => (
                <label key={c} className="custom-input">
                  <span>{c}</span>
                  <input
                    type="number"
                    step="1"
                    min="-100"
                    max="100"
                    value={Math.round(custom[c] * 100)}
                    onChange={e => setPct(c, parseFloat(e.target.value))}
                  />
                  <em>%</em>
                </label>
              ))}
            </div>
          </div>
        )}

        <button className="engine__toggle stresslab__run" onClick={() => onRun(presetId)}>
          RUN SCENARIO ▸
        </button>
      </div>

      <div className="stresslab__meta" id="stressMeta">
        <span className="tag">resolved from factors · {stressRes ? stressRes.n_positions : '—'} positions</span>
        <span className="tag">{confidence}% / {horizon}D</span>
        <span className="tag">{live ? 'live engine' : 'demo engine'}</span>
        {stressRes && <span className="tag tag--hot" id="stressName">{stressRes.scenario_name}</span>}
      </div>

      {stressRes && (
        <div className="stresslab__cards" id="stressCards">
          <article className="stress-card">
            <div className="stress-card__head">
              <span className="stress-card__eyebrow">baseline</span>
              <span className="chip">no shock</span>
            </div>
            <div className="stress-card__kp">
              <span className="readout__label">Portfolio Value</span>
              <div className="readout__value">{fmtFull(stressRes.baseline_value)}</div>
            </div>
            <div className="stress-card__row"><span>P&L</span><b className="pos">$0</b></div>
            <div className="stress-card__row"><span>Value at Risk</span><b>{fmtFull(stressRes.var_baseline)}</b></div>
          </article>

          <article className="stress-card stress-card--accent">
            <div className="stress-card__head">
              <span className="stress-card__eyebrow">stress scenario</span>
              <span className="chip chip--accent">{stressRes.scenario_name}</span>
            </div>
            <div className="stress-card__kp">
              <span className="readout__label">Portfolio Value</span>
              <div className="readout__value">{fmtFull(stressRes.stressed_value)}</div>
            </div>
            <div className="stress-card__row">
              <span>P&L</span>
              <b className={stressRes.pnl < 0 ? 'neg' : 'pos'}>{fmtSigned(stressRes.pnl)}</b>
            </div>
            <div className="stress-card__row">
              <span>Value at Risk</span>
              <b className={stressRes.var_stressed > stressRes.var_baseline ? 'mag' : ''}>{fmtFull(stressRes.var_stressed)}</b>
            </div>
          </article>
        </div>
      )}

      {shocks.length > 0 && (
        <div className="stresslab__shocks" id="stressShocks">
          <span className="engine__group-label">Shocks applied</span>
          <div className="stresslab__shock-list">
            {shocks.map(c => (
              <span key={c} className="tag">{c} <b className={cls[c] < 0 ? 'neg' : 'pos'}>{pctOf(cls[c])}</b></span>
            ))}
          </div>
        </div>
      )}

      <div className="dec-detail__foot" style={{ marginTop: 14 }}>
        {active && !active.live
          ? 'demo — computed in the browser from the same seeded history the charts use. P&L = Σ exposure × shock · stressed VaR puts the scenario into the historical distribution.'
          : 'P&L = Σ exposure × shock · stressed VaR enters the scenario as an observation in the historical distribution, scaled at the baseline book value.'}
      </div>
    </section>
  )
}