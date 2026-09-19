/* shared constants, synthetic data and formatters — ported from the static dashboard */

export const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* seeded PRNG (mulberry32) so the synthetic history is stable but looks organic */
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CONTRIB_DEMO = [
  { label: 'Equity',         pct: 34.2, val: '$823k', hot: true },
  { label: 'FX',             pct: 28.7, val: '$691k' },
  { label: 'Interest Rates', pct: 18.1, val: '$436k' },
  { label: 'Commodities',    pct: 11.4, val: '$275k' },
  { label: 'Volatility',     pct: 5.2,  val: '$125k' },
  { label: 'Credit',         pct: 2.4,  val: '$58k' }
];

export const STRESS_DEMO = { sc1: '−$7.4M', sc2: '+$5.6M', sc3: '−$4.9M', sc4: '−$6.1M' };

/* segmentos del motor central — id = VaREngineRequest.segment del backend */
export const SEGMENTS = [
  { id: 'all', label: 'All Positions', classes: null },
  { id: 'fx', label: 'FX', classes: ['FX'] },
  { id: 'equity', label: 'Equities', classes: ['Equity'] },
  { id: 'commodity', label: 'Commodities', classes: ['Commodities'] },
  { id: 'rate', label: 'Rates', classes: ['Interest Rates'] }
];
export const ENGINE_CONFIDENCE = [90, 95, 99];
export const ENGINE_HORIZON = [1, 5, 10];

export const POS_DEMO = [
  { sym: 'USDCLP', name: 'USD/CLP spot',    cls: 'FX',        qty: 12500000, mv: 12500000, pl: +184300, delta: '1.00', vega: '—',      vc: 0.312 },
  { sym: 'EURUSD', name: 'EUR/USD spot',    cls: 'FX',        qty: 8000000,  mv: 7920000,  pl: -96200,  delta: '1.00', vega: '—',      vc: 0.198 },
  { sym: 'US500',  name: 'S&P 500 index',   cls: 'Equity',    qty: 14000,    mv: 21000000, pl: +1240000, delta: '1.00', vega: '—',      vc: 0.712 },
  { sym: 'US100',  name: 'Nasdaq 100 idx',  cls: 'Equity',    qty: 3200,     mv: 3400000,  pl: -412000, delta: '1.00', vega: '—',      vc: 0.154 },
  { sym: 'GOLD',   name: 'Gold futures opt', cls: 'Commodity', qty: 1180,     mv: 2940000,  pl: +41200,  delta: '0.62', vega: '18,400', vc: 0.224 },
  { sym: 'OIL.WTI', name: 'WTI crude opt',  cls: 'Commodity', qty: 13600,    mv: 980000,   pl: +31800,  delta: '0.48', vega: '45,200', vc: 0.220 },
  { sym: 'UST10Y',  name: 'US Treasury 10Y', cls: 'Interest Rates', qty: 5600, mv: 5904000, pl: +1350,  delta: '1.00', vega: '—',      vc: 0.058 }
];

export const TOTAL_MV = POS_DEMO.reduce((a, p) => a + p.mv, 0);
export const TOTAL_PL = POS_DEMO.reduce((a, p) => a + p.pl, 0);

export const CLASS_CANON = { fx: 'FX', equity: 'Equity', commodity: 'Commodity', rate: 'Interest Rates' };
export const classOf = a => CLASS_CANON[String(a || '').toLowerCase()] || a;

/* serie de pérdidas diarias (pct) con semilla fija — base del motor determinista */
function allLossPct(seed) {
  const rnd = mulberry32(seed);
  const losses = [];
  for (let i = 0; i < 2500; i++) {
    const vol = 0.006 + rnd() * 0.03;
    losses.push((rnd() * 2 - 1) * vol * (0.72 + rnd() * 0.4));
  }
  losses.sort((a, b) => a - b);
  return losses;
}

/* motor central determinista (demo): las cifras salen de la misma historia
   sintética de los gráficos, nunca de un número inventado. Contrato idéntico
   al VaREngineResult del backend, para que el vivo haga swap 1:1. */
export function calcEngineDemo(segment, confidence, horizon) {
  const seg = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];
  const rows = seg.classes ? POS_DEMO.filter(p => seg.classes.includes(p.cls)) : POS_DEMO;
  const mv = rows.reduce((a, p) => a + p.mv, 0);
  const segIdx = SEGMENTS.findIndex(s => s.id === seg.id);
  const nObs = 2500;
  const losses = allLossPct(1200 + segIdx * 37);
  const q = Math.floor(confidence / 100 * (nObs - 1));
  const tail = losses.slice(q);
  const es = tail.reduce((a, v) => a + v, 0) / tail.length;
  const f = Math.sqrt(horizon);
  const round2 = v => Math.round(v * 100) / 100;
  return {
    target: 'Market Risk Portfolio',
    segment: seg.id,
    segmentLabel: seg.label,
    method: 'historical',
    confidence_level: confidence / 100,
    horizon_days: horizon,
    portfolio_value: round2(mv),
    var_value: round2(losses[q] * mv * f),
    expected_shortfall: round2(es * mv * f),
    worst_historical_loss: round2(losses[nObs - 1] * mv * f),
    n_observations: nObs,
    n_factors: rows.length,
    n_positions: rows.length,
    calculation_time_ms: round2((0.55 + segIdx * 0.09 + (confidence - 90) * 0.004) * 1000)
  };
}

export const TWO_DP = v => Math.round(v * 100) / 100;

/* descomposición determinista (demo): igual que el backend, la contribución
   de cada factor sale de la covarianza real de las series sintéticas y se
   aplica al VaR total del motor — Σ shares = 100%. Contrato idéntico a
   FactorDecompositionOut, swap 1:1 con el vivo. */
export function calcDecompositionDemo(confidence, horizon) {
  const rows = POS_DEMO;
  const total = rows.reduce((a, p) => a + p.mv, 0);
  const engine = calcEngineDemo('all', confidence, horizon);
  const CLASS_VOL = { FX: 0.015, Equity: 0.022, Commodity: 0.026, 'Interest Rates': 0.006 };
  const n = 2000;
  const mean = arr => arr.reduce((a, x) => a + x, 0) / n;
  const cov = (a, b) => {
    const ma = mean(a), mb = mean(b);
    let s = 0;
    for (let i = 0; i < n; i++) s += (a[i] - ma) * (b[i] - mb);
    return s / (n - 1);
  };
  const mat = rows.map((p, i) => {
    const rnd = mulberry32(3000 + i * 41);
    const v = CLASS_VOL[p.cls] || 0.02;
    const s = [];
    for (let j = 0; j < n; j++) s.push((rnd() * 2 - 1) * v * (0.8 + rnd() * 0.4));
    return s;
  });
  const w = rows.map(p => p.mv / total);
  const Cw = rows.map((p, i) => mat.reduce((s, mj, j) => s + cov(mat[i], mj) * w[j], 0));
  const pv = w.reduce((s, wi, i) => s + wi * Cw[i], 0);
  const shares = w.map((wi, i) => wi * Cw[i] / pv);
  const totalVar = engine.var_value;
  const factors = rows.map((p, i) => ({
    symbol: p.sym,
    asset_class: p.cls,
    exposure: TWO_DP(p.mv),
    annualized_volatility: TWO_DP(Math.sqrt(cov(mat[i], mat[i])) * Math.sqrt(252)),
    delta: TWO_DP(p.mv),
    gamma: 0,
    vega: 0,
    contribution: TWO_DP(shares[i] * totalVar),
    share: shares[i]
  }));
  const buckets = {};
  factors.forEach(f => {
    const b = buckets[f.asset_class] || (buckets[f.asset_class] = { exposure: 0, contribution: 0, share: 0 });
    b.exposure += f.exposure;
    b.contribution += f.contribution;
    b.share += f.share;
  });
  const classes = Object.keys(buckets).map(k => ({
    asset_class: k,
    exposure: TWO_DP(buckets[k].exposure),
    contribution: TWO_DP(buckets[k].contribution),
    share: buckets[k].share
  }));
  return {
    target: 'Market Risk Portfolio',
    portfolio_value: TWO_DP(total),
    total_var: TWO_DP(totalVar),
    confidence_level: confidence / 100,
    horizon_days: horizon,
    method: 'historical',
    classes,
    factors
  };
}

/* presets de estrés — shocks POR CLASE (las clases canónicas del frontend).
   El backend recibe shocks por símbolo; el frontend los resuelve contra la
   lista de factores actual (demo o live) para que funcionen igual en ambos. */
export const STRESS_PRESETS = [
  { id: 'usdclp',  label: 'USDCLP +10%',            cls: { FX: 0.10 } },
  { id: 'sp500',   label: 'S&P 500 -15%',           cls: { Equity: -0.15 } },
  { id: 'oil',     label: 'Oil -20%',               cls: { Commodity: -0.20 } },
  { id: 'rates',   label: 'Interest Rates +200bps', cls: { 'Interest Rates': 0.02 } },
  { id: 'riskoff', label: 'Global Risk-Off',        cls: { FX: -0.05, Equity: -0.25, Commodity: -0.18, 'Interest Rates': -0.06 } },
  { id: 'custom',  label: 'Custom Scenario',        cls: null }
];
export const CUSTOM_CLASSES = ['FX', 'Equity', 'Commodity', 'Interest Rates'];
export const EMPTY_CUSTOM = { FX: 0, Equity: 0, Commodity: 0, 'Interest Rates': 0 };

export const pctOf = v => (v >= 0 ? '+' : '') + Math.round(v * 1000) / 10 + '%';

/* estrés determinista (demo): mismo procedimiento que el backend — P&L = Σ
   exposición×shock, y el VaR estresado entra el escenario en la distribución
   histórica como observación extra. Contrato idéntico a StressReportOut. */
export function calcStressDemo(scenarioName, classShocks, confidence, horizon) {
  const engine = calcEngineDemo('all', confidence, horizon);
  const baseline = engine.portfolio_value;
  let pnl = 0;
  for (const p of POS_DEMO) pnl += p.mv * (classShocks[p.cls] || 0);
  pnl = TWO_DP(pnl);
  const losses = allLossPct(1200);
  const stressedSeries = losses.concat(pnl / baseline).sort((a, b) => a - b);
  const q = Math.floor(confidence / 100 * (stressedSeries.length - 1));
  const varStressed = stressedSeries[q] * baseline * Math.sqrt(horizon);
  return {
    scenario_name: scenarioName,
    baseline_value: TWO_DP(baseline),
    stressed_value: TWO_DP(baseline + pnl),
    pnl,
    var_baseline: engine.var_value,
    var_stressed: TWO_DP(varStressed),
    n_positions: POS_DEMO.length
  };
}

export const STAGE_DEMO = [
  { idx: 1, name: 'Ingest',           metric: '2.4M',   meta: 'rows · raw feed' },
  { idx: 2, name: 'Validate',         metric: '99.97%', meta: 'quality gate' },
  { idx: 3, name: 'Transform',        metric: '1.2s',   meta: 'reshape · ffill' },
  { idx: 4, name: 'Risk Calculation', metric: '0.8s',   meta: 'var · es · corr' },
  { idx: 5, name: 'PostgreSQL Load',  metric: '0.4s',   meta: 'upsert · indexed' }
];

export const DUR = [600, 520, 1100, 760, 500];

export const FACT = {
  EURUSD: 'FX', XAU: 'Commodities', GOLD: 'Commodities', UST10Y: 'Interest Rates',
  OIL: 'Commodities', USDCLP: 'FX', US500: 'Equity', US100: 'Equity'
};

/* synthetic VaR history — stable, organic, ends on the KPI headline values */
export function genVaR(len, seed) {
  const rnd = mulberry32(seed);
  const z = [];
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    let v = Math.min(1, 0.22 + rnd() * 0.4 + t * (0.28 + rnd() * 0.18));
    if (t > 0.62) v += (t - 0.62) * 1.1 * (0.45 + rnd() * 0.25);
    z.push(Math.min(1, Math.max(0.05, v)));
  }
  const base = z.map(v => 1.05 + 0.77 * v);
  const scale = 1.82 / base[base.length - 1];
  const var95 = base.map(v => v * scale);
  const var90 = var95.map(v => v * (0.76 + 0.02 * z[v]));
  const var99 = var95.map((v, i) => v * (1.26 + 0.08 * z[i]));
  const es = var95.map((v, i) => v * (1.33 + 0.11 * z[i]));
  return { var90, var95, var99, es, len };
}

export const dates = (function () {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < 252) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) out.unshift(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return out;
})();

export const SERIES = { '30': genVaR(30, 7), '90': genVaR(90, 7), '1Y': genVaR(252, 7) };

/* ------------------------------------------------------------------ format */
export const fmtM = v => (v >= 10 ? v.toFixed(1) : v.toFixed(2));
export const fmtUsd = v => {
  const sign = v < 0 ? '−' : '';
  const a = Math.abs(v);
  if (a >= 1e6) return sign + '$' + (a / 1e6 >= 10 ? (a / 1e6).toFixed(1) : (a / 1e6).toFixed(2)) + 'M';
  if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(1) + 'k';
  return sign + '$' + a.toFixed(0);
};
/* importe íntegro, p.ej. $1,824,320 */
export const fmtFull = v => '$' + Math.round(Math.abs(v)).toLocaleString('en-US');
export const fmtSigned = v => (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US');
export const shortDate = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
export const nowTime = () => new Date().toLocaleTimeString('en-US', { hour12: false });
export const sleep = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));