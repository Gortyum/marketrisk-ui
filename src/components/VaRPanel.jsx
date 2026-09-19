import { useState } from 'react'
import { SERIES, dates, fmtUsd, fmtM, shortDate } from '../lib/data.js'

const W = 900, H = 330, P = { l: 46, r: 14, t: 14, b: 30 }, YMAX = 2.6
const px = (i, len) => P.l + (W - P.l - P.r) * i / (len - 1)
const py = v => P.t + (H - P.t - P.b) * (1 - v / YMAX)
const PERIODS = [['30', '30D'], ['90', '90D'], ['1Y', '1Y']]

export default function VaRPanel({ period, setPeriod }) {
  const s = SERIES[period]
  const len = s.len
  const [hover, setHover] = useState(null)
  const tipWRef = { current: 170 }

  const onMouseMove = e => {
    const b = e.currentTarget.getBoundingClientRect()
    const mx = (e.clientX - b.left) / b.width * W
    const idx = Math.max(0, Math.min(len - 1, Math.round((mx - P.l) * (len - 1) / (W - P.l - P.r))))
    setHover({ idx, gx: px(idx, len), gy: py(s.var95[idx]), cx: e.clientX, bTop: b.top, bH: b.height })
  }

  const yTicks = [0, 0.65, 1.3, 1.95, YMAX]
  const nTicks = period === '30' ? 5 : 6
  const xIdx = Array.from({ length: nTicks }, (_, i) => Math.round(i * (len - 1) / (nTicks - 1)))
  const pol = arr => arr.map((v, i) => px(i, len) + ',' + py(v)).join(' ')
  const area = 'M' + s.var95.map((v, i) => px(i, len) + ' ' + py(v)).join(' L') + ` L${W - P.r} ${py(0)} L${P.l} ${py(0)} Z`

  let tipX = 0, tipY = 0
  if (hover) {
    tipX = hover.cx + 18
    tipY = hover.bTop + (hover.gy / H) * hover.bH - 18
    const tw = tipWRef.current
    if (tipX + tw > window.innerWidth - 14) tipX = hover.cx - tw - 18
  }

  return (
    <article className="panel" id="var">
      <div className="panel__head">
        <div className="panel__title">VaR History</div>
        <div className="panel__tools">
          <div className="legend" aria-hidden="true">
            <span className="legend-item"><i style={{ background: 'var(--magenta)' }} />VaR 95%</span>
            <span className="legend-item"><i style={{ background: 'var(--ink)' }} />VaR 99%</span>
            <span className="legend-item"><i className="da" />Expected Shortfall</span>
          </div>
          <div className="seg" role="group" aria-label="History period">
            {PERIODS.map(([k, l]) => (
              <button key={k} data-period={k} aria-pressed={period === k} onClick={() => setPeriod(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="panel__body">
        <div className="chart-shell">
          <svg id="varChart" role="img" aria-label="VaR history line chart" viewBox={`0 0 ${W} ${H}`}
            onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
            <g className="grid-line">
              {yTicks.map(v => <path key={v} d={`M${P.l} ${py(v)}H${W - P.r}`} />)}
            </g>
            {yTicks.map(v => (
              <text key={'y' + v} className="axis-label" x={P.l - 8} y={py(v) + 3} textAnchor="end">
                {v === 0 ? '0' : '$' + v.toFixed(1) + 'M'}
              </text>
            ))}
            {xIdx.map((idx, i) => (
              <g key={'x' + idx}>
                <text className="axis-label" x={px(idx, len)} y={H - 10} textAnchor="middle">
                  {shortDate(dates[idx + 252 - len])}
                </text>
                {i > 0 && <path className="grid-line" d={`M${px(idx, len)} ${P.t}V${H - P.b}`} />}
              </g>
            ))}
            <path className="area" d={area} />
            <polyline className="plot-line" style={{ stroke: 'var(--ink)' }} points={pol(s.var99)} />
            <polyline className="plot-line" style={{ stroke: 'var(--ink)', strokeDasharray: '5 3' }} points={pol(s.es)} />
            <polyline className="plot-line" style={{ stroke: 'var(--magenta)' }} points={pol(s.var95)} />
            <circle cx={px(len - 1, len)} cy={py(s.var95[len - 1])} r="3.5" fill="var(--halo)" stroke="var(--magenta)" strokeWidth="2" />
            <text className="axis-label" x={px(len - 1, len) + 10} y={py(s.var95[len - 1]) + 3} style={{ fill: 'var(--magenta)', fontWeight: 600 }}>
              {fmtM(s.var95[len - 1])}
            </text>
            {hover && (
              <>
                <path className="guide" d={`M${hover.gx} ${P.t}V${H - P.b}`} />
                <circle className="hover-dot" cx={hover.gx} cy={hover.gy} r="3.5" fill="var(--magenta)" />
              </>
            )}
          </svg>
          {hover && (
            <div id="tip" role="tooltip" style={{ display: 'block', left: tipX + 'px', top: tipY + 'px' }}
              ref={node => { if (node) tipWRef.current = node.offsetWidth }}>
              <div className="tip-date">{dates[hover.idx + 252 - len].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div className="tip-row"><span>VaR 95%</span><b className="mag">{fmtUsd(s.var95[hover.idx] * 1e6)}</b></div>
              <div className="tip-row"><span>VaR 99%</span><b>{fmtUsd(s.var99[hover.idx] * 1e6)}</b></div>
              <div className="tip-row"><span>ES 97.5%</span><b>{fmtUsd(s.es[hover.idx] * 1e6)}</b></div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}