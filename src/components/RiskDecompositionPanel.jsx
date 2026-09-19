import { useEffect, useState } from 'react'
import { fmtUsd, fmtFull } from '../lib/data.js'

export default function RiskDecompositionPanel({ dec, live }) {
  const [cls, setCls] = useState(null)
  const [sym, setSym] = useState(null)

  useEffect(() => { setCls(null); setSym(null) }, [dec])

  const classes = dec.classes || []
  const factors = dec.factors || []
  const maxShare = Math.max(...classes.map(c => c.share), 0.001)
  const maxFactorShare = Math.max(...factors.map(f => f.share), 0.001)
  const inClass = cls ? factors.filter(f => f.asset_class === cls) : []
  const detail = sym ? factors.find(f => f.symbol === sym) : null

  const pickClass = c => {
    setCls(cls === c ? null : c)
    setSym(null)
  }
  const pickSym = s => setSym(sym === s ? null : s)

  return (
    <article className="panel" id="decomp">
      <div className="panel__head">
        <div className="panel__title">Risk Factor Decomposition</div>
      </div>
      <div className="panel__body">
        <div id="decClasses">
          {classes.map(c => (
            <div key={c.asset_class} className={'dec-row dec-row--class' + (cls === c.asset_class ? ' is-open' : '')} onClick={() => pickClass(c.asset_class)}>
              <div className="dec-row__lbl">
                <b>{c.asset_class}</b>
                <span className="dec-row__chev">{cls === c.asset_class ? '▾' : '▸'}</span>
              </div>
              <div className="dec-row__track"><div className="dec-row__fill" style={{ width: c.share / maxShare * 100 + '%' }} /></div>
              <div className="dec-row__val">
                <b>{fmtUsd(c.contribution)}</b>
                <span>{(c.share * 100).toFixed(1)}% of VaR</span>
              </div>
            </div>
          ))}
        </div>

        {cls && (
          <div className="dec-level" id="decFactors">
            <div className="dec-level__head">factors in <b>{cls}</b></div>
            {inClass.map(f => (
              <div key={f.symbol} className={'dec-row' + (sym === f.symbol ? ' is-open' : '')} onClick={() => pickSym(f.symbol)}>
                <div className="dec-row__lbl">
                  <b className="dec-row__sym">{f.symbol}</b>
                  <span className="dec-row__chev">{sym === f.symbol ? '▾' : '▸'}</span>
                </div>
                <div className="dec-row__track"><div className="dec-row__fill" style={{ width: f.share / maxFactorShare * 100 + '%' }} /></div>
                <div className="dec-row__val">
                  <b>{fmtUsd(f.contribution)}</b>
                  <span>{(f.share * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {detail && (
          <div className="dec-detail" id="decDetail">
            <div className="dec-detail__head">
              <b>{detail.symbol}</b>
              <span className="chip">{detail.asset_class}</span>
              <span className="chip chip--accent">{(detail.share * 100).toFixed(1)}% of VaR</span>
            </div>
            <div className="dec-detail__grid">
              <div className="calc-row"><span>VaR Contribution</span><b className="mag">{fmtFull(detail.contribution)}</b></div>
              <div className="calc-row"><span>Delta</span><b>{fmtFull(detail.delta)}</b></div>
              <div className="calc-row"><span>Gamma</span><b>{detail.gamma === 0 ? '0 · no options' : detail.gamma}</b></div>
              <div className="calc-row"><span>Vega</span><b>{detail.vega === 0 ? '0 · no options' : fmtFull(detail.vega)}</b></div>
              <div className="calc-row"><span>Annualized vol</span><b>{(detail.annualized_volatility * 100).toFixed(1)}%</b></div>
              <div className="calc-row"><span>Exposure</span><b>{fmtFull(detail.exposure)}</b></div>
            </div>
            <div className="dec-detail__foot">
              {live
                ? 'Delta = exposure of the position · gamma/vega = 0 — the live feed holds linear instruments only; the engine reports them so the contract is stable if options arrive.'
                : 'demo — delta = exposure of the positions in the synthetic book, gamma/vega = 0 (no options in this feed). Decomposition is Euler over the covariance matrix of the series the charts use.'}
            </div>
          </div>
        )}

        <div className="contrib-note">
          Euler allocation over the covariance — Σ shares = {(dec.total_var > 0 ? factors.reduce((a, f) => a + f.share, 0) * 100 : 0).toFixed(0)}% of{' '}
          <b>{fmtFull(dec.total_var)}</b> VaR
        </div>
      </div>
    </article>
  )
}