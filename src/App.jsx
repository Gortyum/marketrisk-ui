import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import VarCenter from './components/VarCenter.jsx'
import VaRPanel from './components/VaRPanel.jsx'
import RiskDecompositionPanel from './components/RiskDecompositionPanel.jsx'
import StressLab from './components/StressLab.jsx'
import PipelinePanel from './components/PipelinePanel.jsx'
import ConsolePanel from './components/ConsolePanel.jsx'
import PositionsPanel from './components/PositionsPanel.jsx'
import Footer from './components/Footer.jsx'
import Toasts from './components/Toasts.jsx'
import { useClock, useTheme } from './lib/hooks.js'
import { POS_DEMO, STAGE_DEMO, DUR, fmtM, fmtUsd, sleep, nowTime, calcEngineDemo, calcDecompositionDemo, calcStressDemo, classOf, EMPTY_CUSTOM, STRESS_PRESETS, SEGMENTS } from './lib/data.js'
import { API, fetchHealth, runLive, buildLiveView, computeEngine, fetchDecomposition, runStress } from './lib/api.js'

export default function App() {
  const { date, time } = useClock()
  const { toggle } = useTheme()

  const [period, setPeriod] = useState('90')
  const [navActive, setNavActive] = useState('top')
  const [lastRun, setLastRun] = useState('not run this session')
  const [busy, setBusy] = useState(false)
  const [segment, setSegment] = useState('all')
  const [confidence, setConfidence] = useState(95)
  const [horizon, setHorizon] = useState(1)
  const [engine, setEngine] = useState(() => calcEngineDemo('all', 95, 1))
  const [liveTick, setLiveTick] = useState(0)
  const [dec, setDec] = useState(() => calcDecompositionDemo(95, 1))
  const [stressRes, setStressRes] = useState(null)
  const [presetId, setPresetId] = useState('usdclp')
  const [customShocks, setCustomShocks] = useState(EMPTY_CUSTOM)
  const [positions, setPositions] = useState(POS_DEMO)
  const [posSub, setPosSub] = useState('7 instruments · gross exposure $54.6M · risk-weighted profile below')
  const [posCount, setPosCount] = useState('7 positions')
  const [netVar, setNetVar] = useState(1.82)
  const [quality, setQuality] = useState({ records: '2,418,392', valid: '99.97%', missing: '0.03%', dupes: '12', lat: '1.8s', fill: '99.97%' })
  const [pipe, setPipe] = useState({
    rail: [1, 1, 1, 1, 1],
    status: 'all stages passed',
    tags: { src: 'sample_prices.csv', rows: '2,418,392 rows', inst: '6 instruments' }
  })
  const [status, setStatus] = useState({ chip: 'status-chip', text: 'connecting…', api: '—' })
  const [envSchema, setEnvSchema] = useState('sample')
  const [footVer, setFootVer] = useState('v1.0.0')
  const [navEtl, setNavEtl] = useState('6')
  const [toasts, setToasts] = useState([])
  const [logs, setLogs] = useState([])

  const healthRef = useRef(null)
  const infoRef = useRef({ live: false, running: false })
  const connRef = useRef('init')
  const toastId = useRef(0)
  const logId = useRef(0)

  const pushLog = (text, kind = '') => {
    const id = ++logId.current
    setLogs(l => [...l, { id, t: nowTime(), text, kind }].slice(-200))
  }
  const clearLogs = () => {
    setLogs([])
    pushLog('console cleared', 'sys')
  }

  const addToast = (msg, cls) => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, msg, cls, time: nowTime() }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200)
  }

  /* ------------------------------------------------------------ live pipeline */
  const applyLiveView = async () => {
    pushLog('executing live pipeline run', 'sys')
    const ver = healthRef.current ? (healthRef.current.version || '1.0.0') : '1.0.0'
    const res = await runLive(ver, (t, k) => pushLog(t, k))
    infoRef.current.live = true
    infoRef.current.portfolioId = res.portfolioId
    setLiveTick(t => t + 1)
    const { positions: p, mv } = buildLiveView(res)
    setPositions(p)
    setNetVar(res.var95.var_value / 1e6)
    setPosSub(p.length + ' instruments · gross ' + fmtUsd(mv) + ' · computed from live positions')
    setQuality(q => ({ ...q, records: res.etl.price_rows_loaded.toLocaleString('en-US'), lat: res.latency + 's' }))
    setPipe({
      rail: [1, 1, 1, 1, 1],
      status: 'all stages passed',
      tags: {
        src: res.etl.source,
        rows: res.etl.price_rows_loaded.toLocaleString('en-US') + ' rows',
        inst: res.etl.instruments_loaded + ' instruments'
      }
    })
    setEnvSchema('live')
    setStatus({ chip: 'status-chip live', text: 'live · VaR computed', api: 'v' + ver })
    setFootVer('v' + ver)
    setNavEtl(String(res.insts.length))
    setLastRun('✓ completed · ' + nowTime())
    pushLog('VaR computed · historical 95% · $' + fmtM(res.var95.var_value / 1e6) + 'M · ' + res.etl.price_rows_loaded.toLocaleString('en-US') + ' rows · ' + res.latency + 's', 'ok')
addToast('Pipeline complete — ' + res.etl.price_rows_loaded.toLocaleString('en-US') + ' rows loaded · ' + res.latency + 's')
    setBusy(false)
    infoRef.current.running = false
    return true
  }

  const runPipeline = async () => {
    if (infoRef.current.running) return
    infoRef.current.running = true
    setBusy(true)
    setLastRun('running…')
    pushLog('pipeline run started · 6 instruments · 252 trading days', 'sys')
    let cur = [-1, -1, -1, -1, -1]
    setPipe(p => ({ ...p, rail: cur, status: 'running pipeline' }))
    for (let i = 0; i < 5; i++) {
      cur = cur.map((v, k) => k < i ? 1 : (k === i ? 0 : -1))
      setPipe(p => ({ ...p, rail: cur }))
      const t0 = performance.now()
      pushLog('[step] ' + STAGE_DEMO[i].name + ' · ' + STAGE_DEMO[i].meta + ' …', 'sys')
      await sleep(DUR[i])
      pushLog('[ok] ' + STAGE_DEMO[i].name + ' · ' + STAGE_DEMO[i].metric + ' · ' + Math.round(performance.now() - t0) + 'ms', 'ok')
    }
    setPipe(p => ({ ...p, rail: [1, 1, 1, 1, 1], status: 'all stages passed' }))
    setLastRun('✓ completed · ' + nowTime())
    pushLog('all 5 stages passed', 'ok')

    let ok = false, err = null
    if (healthRef.current && healthRef.current.status === 'ok') {
      try { ok = await applyLiveView() } catch (e) { err = e; addToast('Pipeline errored — ' + e.message, 'err') }
    }
    if (!ok && !err) {
      pushLog('offline run — demo feed executed locally', 'sys')
      addToast('Demo run — sample feed executed locally')
      setLastRun('✓ completed · ' + nowTime())
      setBusy(false)
      infoRef.current.running = false
    }
  }

  /* ------------------------------------------------------------ health ping */
  useEffect(() => {
    let cancelled = false
    const ping = async () => {
      try {
        const health = await fetchHealth()
        if (cancelled) return
        healthRef.current = health
        if (connRef.current !== 'live') {
          connRef.current = 'live'
          pushLog('backend online · API v' + health.version, 'ok')
        }
        setStatus({ chip: 'status-chip live', text: 'live · API v' + health.version, api: 'v' + health.version })
        const pf = await (await fetch(API + '/portfolios')).json()
        const mine = pf.find(p => p.name === 'Market Risk Portfolio')
        if (mine && !infoRef.current.running && !infoRef.current.live) {
          const detail = await (await fetch(API + '/portfolios/' + mine.id)).json()
          if (detail.positions && detail.positions.length) {
            setPosCount(detail.positions.length + ' positions')
            setLastRun('running…')
            setBusy(true)
            try { await applyLiveView() } catch (e) { /* keep demo */ }
          }
        }
      } catch (e) {
        if (cancelled) return
        healthRef.current = null
        if (connRef.current !== 'off') {
          connRef.current = 'off'
          pushLog('backend unreachable — operating on demo dataset', 'err')
        }
        setStatus({ chip: 'status-chip', text: 'sample dataset', api: '—' })
      }
    }
    pushLog('console ready · monitoring ETL pipeline', 'sys')
    ping()
    const i = setInterval(ping, 30000)
    return () => { cancelled = true; clearInterval(i) }
  }, [])

  /* ------------------------------------------------------------ central engine */
  useEffect(() => {
    let on = true
    const pid = infoRef.current.portfolioId
    if (infoRef.current.live && pid) {
      computeEngine(pid, segment, confidence, horizon, pushLog)
        .then(res => {
          if (!on) return
          const label = SEGMENTS.find(s => s.id === res.segment)?.label || res.segment
          setEngine({ ...res, segmentLabel: label })
        })
        .catch(() => { if (on) setEngine(calcEngineDemo(segment, confidence, horizon)) })
    } else {
      setEngine(calcEngineDemo(segment, confidence, horizon))
    }
    return () => { on = false }
  }, [segment, confidence, horizon, liveTick])

  /* ------------------------------------------------------------ decomposición */
  const canonDec = raw => ({
    ...raw,
    classes: (raw.classes || []).map(c => ({ ...c, asset_class: classOf(c.asset_class) })),
    factors: (raw.factors || []).map(f => ({ ...f, asset_class: classOf(f.asset_class) }))
  })

  useEffect(() => {
    let on = true
    const pid = infoRef.current.portfolioId
    if (infoRef.current.live && pid) {
      fetchDecomposition(pid, confidence, horizon, pushLog)
        .then(res => { if (on) setDec(canonDec(res)) })
        .catch(() => { if (on) setDec(calcDecompositionDemo(confidence, horizon)) })
    } else {
      setDec(calcDecompositionDemo(confidence, horizon))
    }
    return () => { on = false }
  }, [confidence, horizon, liveTick])

  /* ------------------------------------------------------------ estrés */
  const runScenario = async scenarioId => {
    const preset = STRESS_PRESETS.find(p => p.id === scenarioId)
    const name = preset ? preset.label : 'Custom Scenario'
    const cls = scenarioId === 'custom' ? customShocks : (preset ? preset.cls : {})

    const pid = infoRef.current.portfolioId
    if (infoRef.current.live && pid && dec && dec.factors) {
      const shocks = {}
      for (const f of dec.factors) {
        const c = classOf(f.asset_class)
        if (cls[c] !== undefined) shocks[f.symbol] = cls[c]
      }
      try {
        const res = await runStress(pid, name, shocks, confidence, horizon, pushLog)
        setStressRes({ ...res, el: { label: name, cls, live: true } })
        return
      } catch (e) {
        pushLog('stress report errored — falling back to demo · ' + e.message, 'err')
      }
    }
    const res = calcStressDemo(name, cls, confidence, horizon)
    setStressRes({ ...res, el: { label: name, cls, live: false } })
  }

  return (
    <div className="app">
      <Sidebar navActive={navActive} setNavActive={setNavActive} navEtl={navEtl} envApi={status.api} envSchema={envSchema} footVer={footVer} />
      <main className="main">
        <Topbar date={date} time={time} lastRun={lastRun} statusChip={status.chip} statusText={status.text} busy={busy} onRun={runPipeline} toggle={toggle} />
        <div className="stack">
          <VarCenter
            engine={engine}
            live={status.chip.includes('live')}
            segment={segment} setSegment={setSegment}
            confidence={confidence} setConfidence={setConfidence}
            horizon={horizon} setHorizon={setHorizon}
          />
          <section className="grid-va">
            <VaRPanel period={period} setPeriod={setPeriod} confidence={confidence} />
            <RiskDecompositionPanel dec={dec} live={status.chip.includes('live')} />
          </section>
          <StressLab
            live={status.chip.includes('live')}
            stressRes={stressRes}
            presetId={presetId} setPresetId={setPresetId}
            custom={customShocks} setCustom={setCustomShocks}
            onRun={runScenario}
            confidence={confidence} horizon={horizon}
          />
          <PipelinePanel pipe={pipe} quality={quality} />
          <ConsolePanel logs={logs} onClear={clearLogs} />
          <PositionsPanel positions={positions} posSub={posSub} posCount={posCount} netVar={netVar} />
          <Footer footVer={footVer} />
        </div>
      </main>
      <Toasts toasts={toasts} />
    </div>
  )
}