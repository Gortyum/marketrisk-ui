import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import KpiRow from './components/KpiRow.jsx'
import VaRPanel from './components/VaRPanel.jsx'
import FactorPanel from './components/FactorPanel.jsx'
import PipelinePanel from './components/PipelinePanel.jsx'
import ConsolePanel from './components/ConsolePanel.jsx'
import PositionsPanel from './components/PositionsPanel.jsx'
import Footer from './components/Footer.jsx'
import Toasts from './components/Toasts.jsx'
import { useClock, useTheme } from './lib/hooks.js'
import { CONTRIB_DEMO, POS_DEMO, STAGE_DEMO, DUR, fmtM, fmtUsd, sleep, nowTime } from './lib/data.js'
import { API, fetchHealth, runLive, buildLiveView } from './lib/api.js'

const STRESS_DEMO = [
  { id: 'sc1', label: 'Equity crash −20%', val: '−$7.4M', neg: true },
  { id: 'sc2', label: 'Equity rally +15%', val: '+$5.6M', neg: false },
  { id: 'sc3', label: 'FX devaluation −10%', val: '−$4.9M', neg: true },
  { id: 'sc4', label: 'Vol spike −25%', val: '−$6.1M', neg: true }
]
const STRESS_LABELS = { equity_crash: 'Equity crash −20%', equity_rally: 'Equity rally +15%', fx_devaluation: 'FX devaluation −10%', vol_spike: 'Vol spike −25%' }

export default function App() {
  const { date, time } = useClock()
  const { toggle } = useTheme()

  const [period, setPeriod] = useState('90')
  const [navActive, setNavActive] = useState('top')
  const [lastRun, setLastRun] = useState('not run this session')
  const [busy, setBusy] = useState(false)
  const [kpi, setKpi] = useState({ var: '$1.82', es: '$2.41', exp: '$48.7', fact: '42', varMethod: 'historical', factChip: 'active factors' })
  const [contrib, setContrib] = useState(CONTRIB_DEMO)
  const [contribNote, setContribNote] = useState('ΔVaR contribution · sum = 100%')
  const [positions, setPositions] = useState(POS_DEMO)
  const [posSub, setPosSub] = useState('6 instruments · gross exposure $48.7M · risk-weighted profile below')
  const [posCount, setPosCount] = useState('6 positions')
  const [netVar, setNetVar] = useState(1.82)
  const [stress, setStress] = useState(STRESS_DEMO)
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
    const { contrib: c, positions: p, mv } = buildLiveView(res)
    setKpi({
      var: '$' + fmtM(res.var95.var_value / 1e6),
      es: '$' + fmtM(res.var95.expected_shortfall / 1e6),
      exp: '$' + fmtM(mv / 1e6),
      fact: String(res.insts.length),
      varMethod: 'computed live',
      factChip: res.insts.length ? 'live factors' : 'active factors'
    })
    setContrib(c)
    setContribNote('ΔVaR contribution · from live sensitivities')
    setPositions(p)
    setNetVar(res.var95.var_value / 1e6)
    setPosSub(p.length + ' instruments · gross ' + fmtUsd(mv) + ' · computed from live positions')
    const sc = Object.fromEntries((res.stress || []).map(s => [s.scenario_name, s.impact]))
    setStress(STRESS_DEMO.map(d => ({ ...d, val: sc[d.id] === undefined ? d.val : fmtUsd(sc[d.id]), neg: sc[d.id] === undefined ? d.neg : sc[d.id] < 0 })))
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

  return (
    <div className="app">
      <Sidebar navActive={navActive} setNavActive={setNavActive} navEtl={navEtl} envApi={status.api} envSchema={envSchema} footVer={footVer} />
      <main className="main">
        <Topbar date={date} time={time} lastRun={lastRun} statusChip={status.chip} statusText={status.text} busy={busy} onRun={runPipeline} toggle={toggle} />
        <div className="stack">
          <KpiRow kpi={kpi} />
          <section className="grid-va">
            <VaRPanel period={period} setPeriod={setPeriod} />
            <FactorPanel contrib={contrib} note={contribNote} />
          </section>
          <PipelinePanel pipe={pipe} quality={quality} stress={stress} />
          <ConsolePanel logs={logs} onClear={clearLogs} />
          <PositionsPanel positions={positions} posSub={posSub} posCount={posCount} netVar={netVar} />
          <Footer footVer={footVer} />
        </div>
      </main>
      <Toasts toasts={toasts} />
    </div>
  )
}