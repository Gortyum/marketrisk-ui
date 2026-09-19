export default function KpiRow({ kpi }) {
  return (
    <section className="row-kpis" aria-label="Key risk metrics">
      <article className="kpi is-accent">
        <div className="kpi-label">Value at Risk</div>
        <div className="kpi-value"><span id="kpiVar">{kpi.var}</span><span className="unit">M</span></div>
        <div className="kpi-meta"><span className="chip chip--accent">95% / 1D</span><span className="chip" id="kpiVarMethod">{kpi.varMethod}</span></div>
      </article>
      <article className="kpi">
        <div className="kpi-label">Expected Shortfall</div>
        <div className="kpi-value"><span id="kpiEs">{kpi.es}</span><span className="unit">M</span></div>
        <div className="kpi-meta"><span className="chip">97.5% / 1D</span></div>
      </article>
      <article className="kpi">
        <div className="kpi-label">Portfolio Exposure</div>
        <div className="kpi-value"><span id="kpiExp">{kpi.exp}</span><span className="unit">M</span></div>
        <div className="kpi-meta"><span className="chip chip--accent">+3.2%</span></div>
      </article>
      <article className="kpi">
        <div className="kpi-label">Risk Factors</div>
        <div className="kpi-value" id="kpiFact">{kpi.fact}</div>
        <div className="kpi-meta"><span className="chip" id="kpiFactChip">{kpi.factChip}</span></div>
      </article>
    </section>
  )
}