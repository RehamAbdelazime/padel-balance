import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/shared/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { PlayersPage } from '@/features/players/pages/PlayersPage'
import { PlayerProfilePage } from '@/features/players/pages/PlayerProfilePage'
import { SessionsPage } from '@/features/sessions/pages/SessionsPage'
import { SessionDetailPage } from '@/features/sessions/pages/SessionDetailPage'
import { SessionReportPage } from '@/features/reports/pages/SessionReportPage'

/**
 * Application route table.
 *
 * All content routes are children of AppShell (provides sidebar + header layout).
 * Detail routes are siblings of their list routes — each receives an ID via
 * useParams and renders its own full-page layout.
 */
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
