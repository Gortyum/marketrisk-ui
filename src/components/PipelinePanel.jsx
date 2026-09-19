import { STAGE_DEMO } from '../lib/data.js'
import QualityGates from './QualityGates.jsx'
import StressPanel from './StressPanel.jsx'

export default function PipelinePanel({ pipe, quality, stress }) {
  const anyRun = pipe.rail.some(x => x === 0)
  const allDone = pipe.rail.every(x => x === 1)
  return (
    <article className="panel pipeline" id="etl">
      <div className="panel__head">
        <div className="panel__title">ETL Pipeline</div>
        <div className={'status-chip' + (pipe.status === 'all stages passed' ? ' live' : '')} id="pipeChip">
          <span className="dot" /><span id="pipeStatus">{pipe.status}</span>
        </div>
      </div>
      <div className="panel__body">
        <div className="etl-rail" id="rail">
          <div className={'rail-line' + (anyRun ? ' run' : '') + (allDone ? ' done' : '')} aria-hidden="true"><span className="rail-dot" /></div>
          {STAGE_DEMO.map((st, i) => {
            const mode = pipe.rail[i] ?? -1
            return (
              <div key={st.idx} className={'stage' + (mode === 1 ? ' is-done' : mode === 0 ? ' is-run' : '')} data-idx={i}>
                <div>
                  <div className="stage__glyph">{String(st.idx).padStart(2, '0')}</div>
                </div>
                <div className="tm">
                  <div className="stage__name">{st.name}</div>
                  <div className="stage__metric"><span className="stm">{st.metric}</span></div>
                  <div className="stage__meta">{st.meta}</div>
                  <div className="st-stage-chip">{mode === 0 ? 'Running' : mode === 1 ? 'Completed' : 'Queued'}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="pipeline-foot" id="pipeFoot">
          <span className="tag" id="tagSrc">{pipe.tags.src}</span>
          <span className="tag" id="tagRows">{pipe.tags.rows}</span>
          <span className="tag" id="tagInst">{pipe.tags.inst}</span>
        </div>
      </div>
      <div className="etl-sub">
        <QualityGates q={quality} />
        <StressPanel items={stress} />
      </div>
    </article>
  )
}