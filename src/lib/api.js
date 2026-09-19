import { mulberry32, dates, FACT, fmtUsd } from './data.js'

let api = (import.meta.env.VITE_API_BASE || '').trim()
if (api && !/^https?:\/\//i.test(api)) api = 'https://' + api
export const API = api.replace(/\/+$/, '')

const req = async (u, opts = {}, log) => {
  const t0 = performance.now()
  const r = await fetch(API + u, opts)
  const ms = Math.round(performance.now() - t0)
  const m = opts.method || 'GET'
  if (!r.ok) {
    if (log) log(m + ' ' + u + ' → ' + r.status + ' · ' + ms + 'ms', 'err')
    throw new Error(API + u + ' · ' + r.status)
  }
  if (log) log(m + ' ' + u + ' → ' + r.status + ' · ' + ms + 'ms', 'ok')
  return r.json()
}
const jget = (u, log) => req(u, {}, log)
const jpost = (u, body, log) => req(u, {
  method: 'POST',
  body: body instanceof FormData ? body : JSON.stringify(body),
  ...(body instanceof FormData ? {} : { headers: { 'Content-Type': 'application/json' } })
}, log)

export const LIVE_QTY = { AAPL: 16750, MSFT: 10720, NVDA: 14070, EURUSD: 26800000, XAU: 4020, UST10Y: 6700 }

const INSTR_SPEC = [
  ['AAPL', 'Apple Inc.', 185, 0.28, 0.15],
  ['MSFT', 'Microsoft Corp.', 420, 0.22, 0.12],
  ['NVDA', 'NVIDIA Corp.', 122, 0.40, 0.25],
  ['EURUSD', 'EUR/USD spot', 1.090, 0.08, 0],
  ['XAU', 'Gold spot', 2450, 0.15, 0.05],
  ['UST10Y', 'US Treasury 10Y', 4.2, 0.10, 0]
]

const DAYS = 252

export function genCSV() {
  const rows = []
  const raw = []
  for (let k = 0; k < INSTR_SPEC.length; k++) {
    const [sym, name, start, vol, drift] = INSTR_SPEC[k]
    const rnd = mulberry32(100 + k)
    const closes = [start]
    for (let d = 1; d < DAYS; d++) {
      closes.push(closes[d - 1] * Math.exp(drift / 252 + vol / Math.sqrt(252) * (rnd() * 2 - 1)))
    }
    for (let d = 0; d < DAYS; d++) {
      const dt = dates[252 - DAYS + d]
      raw.push([sym, name, dt.toISOString().slice(0, 10), closes[d].toFixed(4)])
    }
  }
  for (const r of raw) rows.push(r.join(','))
  return ['symbol,name,date,close', ...rows].join('\n')
}

export async function fetchHealth() {
  const r = await fetch(API + '/health')
  if (!r.ok) throw new Error('/health · ' + r.status)
  return r.json()
}

/* motor central: VaR + ES de un segmento con trazabilidad (mismo contrato del backend). */
export async function computeEngine(portfolioId, segment, confidence, horizon, log) {
  return jpost('/risk/portfolios/' + portfolioId + '/var/engine', {
    segment,
    confidence_level: confidence / 100,
    horizon_days: horizon,
    method: 'historical'
  }, log)
}

/* descomposición al VaR por factor/clase (Euler allocation). */
export async function fetchDecomposition(portfolioId, confidence, horizon, log) {
  return jget('/risk/portfolios/' + portfolioId + '/var/factors?confidence_level=' +
    (confidence / 100) + '&horizon_days=' + horizon + '&lookback_days=252', log)
}

/* estrés de un escenario: baseline vs. estresado (valor, P&L y VaR). */
export async function runStress(portfolioId, scenarioName, shocks, confidence, horizon, log) {
  return jpost('/risk/portfolios/' + portfolioId + '/stress/report', {
    scenario_name: scenarioName,
    shocks,
    confidence_level: confidence / 100,
    horizon_days: horizon,
    lookback_days: 252
  }, log)
}

/* upload feed, keep/refresh "Market Risk Portfolio", compute VaR/es/sensitivities/stress.
   log(text, kind) is optional and receives every request as a console line. */
export async function runLive(version, log) {
  const csv = genCSV()
  const fd = new FormData()
  fd.append('file', new Blob([csv], { type: 'text/csv' }), 'market_feed.csv')
  const t0 = performance.now()
  const etl = await jpost('/etl/upload?currency=USD', fd, log)
  const latency = ((performance.now() - t0) / 1000).toFixed(2)

  const insts = await jget('/etl/instruments', log)
  const pf = await jget('/portfolios', log)
  let portfolio = pf.find(p => p.name === 'Market Risk Portfolio')
  if (!portfolio) {
    portfolio = await jpost('/portfolios', { name: 'Market Risk Portfolio' }, log)
  }
  const detail = await jget('/portfolios/' + portfolio.id, log)
  const existing = new Set(detail.positions.map(p => p.instrument_id))
  for (const inst of insts) {
    if (!existing.has(inst.id) && LIVE_QTY[inst.symbol]) {
      await jpost('/portfolios/' + portfolio.id + '/positions', {
        instrument_id: inst.id,
        quantity: LIVE_QTY[inst.symbol]
      }, log)
    }
  }
  const var95 = await jpost('/risk/portfolios/' + portfolio.id + '/var', { method: 'historical', confidence_level: 0.95 }, log)
  const var99 = await jpost('/risk/portfolios/' + portfolio.id + '/var', { method: 'historical', confidence_level: 0.99 }, log)
  const sens = await jget('/risk/portfolios/' + portfolio.id + '/sensitivities', log)
  const stress = await jpost('/risk/portfolios/' + portfolio.id + '/stress', {}, log)

  return { etl, latency, insts, portfolioId: portfolio.id, var95, var99, sens, stress, version }
}

/* build the live view buckets/rows from a runLive() result */
export function buildLiveView(res) {
  const mv = res.sens.reduce((a, s) => a + s.exposure, 0)
  const buckets = {}
  const totalExp = mv || 1
  res.sens.forEach(s => {
    const key = FACT[s.instrument] || 'Equity'
    buckets[key] = (buckets[key] || 0) + s.exposure
  })
  const max = buckets[Object.keys(buckets)[0]] || 0
  const contrib = Object.keys(buckets).map(k => ({
    label: k, pct: (buckets[k] / totalExp) * 100, val: fmtUsd(buckets[k]), hot: buckets[k] >= max
  }))
  const positions = res.insts
    .filter(i => LIVE_QTY[i.symbol])
    .map(i => {
      const ex = (res.sens.find(s => s.instrument === i.symbol) || {}).exposure || 0
      const cls = FACT[i.symbol] || 'Equity'
      return {
        sym: i.symbol, name: i.name, cls,
        qty: LIVE_QTY[i.symbol], mv: ex, pl: null,
        delta: cls === 'Commodities' ? '0.55' : '1.00',
        vega: cls === 'Commodities' ? '12,800' : '—',
        vc: (res.var95.var_value / totalExp) * ex / 1e6
      }
    })
  return { contrib, positions, mv }
}