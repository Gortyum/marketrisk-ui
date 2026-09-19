# https://marketrisk-ui.vercel.app/
# Market Risk Dashboard — Frontend (React)

Dashboard de análisis de riesgo de mercado (VaR, Expected Shortfall,
sensibilidades, pipeline ETL y stress testing) construido con **React + Vite**.
Consume la API FastAPI del backend (hermano en `../backend/`), que en
producción sirve también este build.

## Stack

- **React 19** + **Vite 8** (`@vitejs/plugin-react`), JavaScript (ESM, JSX).
- Sin framework de UI: los estilos son propios (`src/index.css`) con tokens
  CSS, tema claro/oscuro y diseño responsive.
- Zero dependencies en runtime fuera de React.

## Estructura

```
frontend/
├── index.html            # entrada de Vite + script de tema inline (evita FOUC)
├── vite.config.js        # base './', build → dist/, proxy dev → 127.0.0.1:8000
├── package.json          # scripts: dev / build / preview
├── src/
│   ├── main.jsx          # bootstrap de la app
│   ├── App.jsx           # estado global, pipeline ETL, consola, ping /health
│   ├── index.css         # diseño completo + tokens de tema (light/dark)
│   ├── lib/data.js       # datos demo y generadores sintéticos (genVaR, CSV…)
│   ├── lib/api.js        # cliente de la API REST (upload, VaR, stress…)
│   ├── lib/hooks.js      # useClock, useTheme
│   └── components/       # Sidebar, Topbar, KpiRow, VaRPanel, FactorPanel,
│                         # PipelinePanel, ConsolePanel, QualityGates,
│                         # StressPanel, PositionsPanel, Footer, Toasts
└── dist/                 # build de producción (no versionado; lo genera npm run build)
```

## Desarrollo

Requisito: backend levantado en `127.0.0.1:8000` (ver `../backend/README.md`).

```powershell
cd F:\progra\curso\frontend
npm install          # o npm ci para reproducir package-lock.json
npm run dev          # http://localhost:5173 (proxya la API a :8000)
```

Si la API vive en otro origen, se puede fijar antes del `build`/`dev` la
variable `VITE_API_BASE` (p. ej. `VITE_API_BASE=https://api.ejemplo.com`).

## Producción

```powershell
npm run build        # genera dist/
```

FastAPI sirve `frontend/dist/` desde la raíz (mismo origen: API + dashboard,
sin CORS). El `.\start.ps1` de la raíz del proyecto hace el build + levanta el
servidor en un solo paso.

## Notas

- **Tema**: se elige con `?theme=dark|light` en la URL, luego `localStorage`
  (`mrx-theme`) y por último `prefers-color-scheme`. El script inline de
  `index.html` aplica el tema antes del primer render para evitar parpadeo.
- **Demo offline**: sin backend la app funciona con datos de ejemplo y lo
  indica en la consola; con backend (modo live) el botón *Run pipeline* sube
  el feed, crea el portafolio/posiciones y calcula VaR, ES y stress reales.
- **Consola de proceso**: panel que muestra cada etapa del pipeline y cada
  llamada HTTP (método, ruta, status, ms) durante la ejecución live.
- **Reproductibilidad**: `package-lock.json` está versionado; `node_modules/`
  y `dist/` están en `.gitignore` (se regeneran con `npm ci` / `npm run build`).
