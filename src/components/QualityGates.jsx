export default function QualityGates({ q }) {
  return (
    <section className="mini" id="quality">
      <div className="mini__title">Data Quality Gates</div>
      <div style={{ marginTop: 8 }}>
        <div className="qstat"><span>Records processed</span><b id="qRecords">{q.records}</b></div>
        <div className="qstat"><span>Validation success</span><b className="mag" id="qValid">{q.valid}</b></div>
        <div className="qstat"><span>Missing values</span><b id="qMissing">{q.missing}</b></div>
        <div className="qstat"><span>Duplicate records</span><b id="qDupes">{q.dupes}</b></div>
        <div className="qstat"><span>Pipeline latency</span><b id="qLat">{q.lat}</b></div>
        <div className="q-bar-wrap">
          <div className="q-bar" aria-hidden="true"><i id="qBarFill" style={{ width: q.fill }} /></div>
        </div>
      </div>
    </section>
  )
}