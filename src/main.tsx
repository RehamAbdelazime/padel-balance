import React from 'react'
import ReactDOM from 'react-dom/client'

// i18n must be initialised before any React component renders.
// The side-effect import runs synchronously (bundled resources).
import './shared/i18n'

import { App } from './app/App'
import { ratingService } from '@/features/rating'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    '[PadelBalance] Root element #root not found in index.html. ' +
      'Ensure <div id="root"></div> exists in the document body.',
  )
}

// ── Rating bootstrap ──────────────────────────────────────────────────────────
// Starts the first full rating rebuild immediately, before any component
// renders. React mounts in parallel while the rebuild runs in the background.
//
// Duplicate-call prevention:
//   1. Module scope — main.tsx executes exactly once per page load
//      (JavaScript module semantics; not subject to React StrictMode double-
//      invocation because this is outside any component or effect).
//   2. Single-flight guard — RatingService._rebuilding ensures that if any
//      other path calls rebuildRatings() while this one is still running,
//      they share the same Promise rather than starting a second replay.
//
// `void` is explicit fire-and-forget: the app renders while the rebuild
// runs. Rating queries that mount before the rebuild completes return the
// default state; once the rebuild finishes they will be fresh on the next
// read cycle.
void ratingService.rebuildRatings()

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
