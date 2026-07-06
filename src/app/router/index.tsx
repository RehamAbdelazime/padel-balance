import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/shared/components/layout/AppShell'

/**
 * Application route table.
 *
 * All content routes are children of AppShell (provides sidebar + header layout).
 * Detail routes are siblings of their list routes — each receives an ID via
 * useParams and renders its own full-page layout.
 *
 * Every page is lazy-loaded (Sprint RC1 Step 4): without this, all 6 pages —
 * Dashboard, Sessions, Players, Session Detail, Session Report, Player
 * Profile — shipped in one bundle regardless of which page the user
 * actually opened first. AppShell wraps `<Outlet />` in one shared
 * `<Suspense>` boundary, so no per-route fallback wiring is needed here.
 */
const DashboardPage      = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const PlayersPage        = lazy(() => import('@/features/players/pages/PlayersPage').then(m => ({ default: m.PlayersPage })))
const PlayerProfilePage   = lazy(() => import('@/features/players/pages/PlayerProfilePage').then(m => ({ default: m.PlayerProfilePage })))
const SessionsPage        = lazy(() => import('@/features/sessions/pages/SessionsPage').then(m => ({ default: m.SessionsPage })))
const SessionDetailPage   = lazy(() => import('@/features/sessions/pages/SessionDetailPage').then(m => ({ default: m.SessionDetailPage })))
const SessionReportPage   = lazy(() => import('@/features/reports/pages/SessionReportPage').then(m => ({ default: m.SessionReportPage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'players',
        element: <PlayersPage />,
      },
      {
        path: 'players/:playerId',
        element: <PlayerProfilePage />,
      },
      {
        path: 'sessions',
        element: <SessionsPage />,
      },
      {
        path: 'sessions/:sessionId',
        element: <SessionDetailPage />,
      },
      {
        path: 'sessions/:sessionId/report',
        element: <SessionReportPage />,
      },
    ],
  },
])
