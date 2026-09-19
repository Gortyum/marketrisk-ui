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

export const POS_DEMO = [
  { sym: 'USDCLP', name: 'USD/CLP spot',    cls: 'FX',        qty: 12500000, mv: 12500000, pl: +184300, delta: '1.00', vega: '—',      vc: 0.312 },
  { sym: 'EURUSD', name: 'EUR/USD spot',    cls: 'FX',        qty: 8000000,  mv: 7920000,  pl: -96200,  delta: '1.00', vega: '—',      vc: 0.198 },
  { sym: 'US500',  name: 'S&P 500 index',   cls: 'Equity',    qty: 14000,    mv: 21000000, pl: +1240000, delta: '1.00', vega: '—',      vc: 0.712 },
  { sym: 'US100',  name: 'Nasdaq 100 idx',  cls: 'Equity',    qty: 3200,     mv: 3400000,  pl: -412000, delta: '1.00', vega: '—',      vc: 0.154 },
  { sym: 'GOLD',   name: 'Gold futures opt', cls: 'Commodity', qty: 1180,     mv: 2940000,  pl: +41200,  delta: '0.62', vega: '18,400', vc: 0.224 },
  { sym: 'OIL.WTI', name: 'WTI crude opt',  cls: 'Commodity', qty: 13600,    mv: 980000,   pl: +31800,  delta: '0.48', vega: '45,200', vc: 0.220 }
];

export const TOTAL_MV = POS_DEMO.reduce((a, p) => a + p.mv, 0);
export const TOTAL_PL = POS_DEMO.reduce((a, p) => a + p.pl, 0);

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
  const var99 = var95.map((v, i) => v * (1.26 + 0.08 * z[i]));
  const es = var95.map((v, i) => v * (1.33 + 0.11 * z[i]));
  return { var95, var99, es, len };
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
export const shortDate = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
export const nowTime = () => new Date().toLocaleTimeString('en-US', { hour12: false });
export const sleep = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));