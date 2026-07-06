import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { usePlayerQuery } from '../hooks/usePlayers'
import { usePlayerStatsQuery } from '@/features/statistics/hooks/usePlayerStats'
import type { PlayerStats } from '@/features/statistics/types'

// ── Avatar helpers (mirrors PlayerCard — display utilities, not business logic) ─

function getAvatarColor(name: string): string {
  const COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-600',
    'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
    'bg-pink-500', 'bg-rose-500',
  ]
  const index = (name.codePointAt(0) ?? 0) % COLORS.length
  return COLORS[index] ?? 'bg-gray-500'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

// ── Stat display block ────────────────────────────────────────────────────────

interface StatBlockProps {
  label: string
  value: string | number
  /** When true, prefix positive numbers with '+'. */
  signed?: boolean
}

function StatBlock({ label, value, signed = false }: StatBlockProps) {
  const formatted =
    signed && typeof value === 'number' && value > 0 ? `+${value}` : value

  return (
    <div className="flex flex-col items-center rounded-lg border bg-card p-4 text-center">
      <span className="text-2xl font-bold tabular-nums">{formatted}</span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Stats grid ────────────────────────────────────────────────────────────────

function StatsGrid({ stats }: { stats: PlayerStats }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {/* Match-level row: outcome counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label={t('statistics.matchesPlayed')}    value={stats.matchesPlayed} />
        <StatBlock label={t('statistics.matchesWon')}       value={stats.matchesWon} />
        <StatBlock label={t('statistics.matchesLost')}      value={stats.matchesLost} />
        <StatBlock label={t('statistics.matchWinPercentage')} value={`${stats.matchWinPercentage}%`} />
      </div>

      {/* Score-level row: cumulative score totals */}
      <div className="grid grid-cols-3 gap-3">
        <StatBlock label={t('statistics.gamesWon')}     value={stats.gamesWon} />
        <StatBlock label={t('statistics.gamesLost')}    value={stats.gamesLost} />
        <StatBlock label={t('statistics.gameDifference')} value={stats.gameDifference} signed />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PlayerProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { playerId } = useParams<{ playerId: string }>()

  if (!playerId) return <Navigate to="/players" replace />

  const playerQuery = usePlayerQuery(playerId)
  const statsQuery  = usePlayerStatsQuery(playerId)

  // ── Loading state (player is the primary resource) ────────────────────────
  if (playerQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t('common.loading')}
        />
      </div>
    )
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (playerQuery.isError || !playerQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t('common.error')}</p>
        <Button variant="outline" onClick={() => void playerQuery.refetch()}>
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  const player = playerQuery.data

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => void navigate('/players')}
      >
        <ArrowLeft className="me-1.5 h-4 w-4" aria-hidden="true" />
        {t('players.detail.backToPlayers')}
      </Button>

      {/* Player header */}
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${getAvatarColor(player.name)}`}
          aria-hidden="true"
        >
          {getInitials(player.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
          {player.phone && (
            <p className="mt-0.5 text-sm text-muted-foreground">{player.phone}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Statistics section */}
      <section aria-label={t('statistics.title')}>
        <h2 className="mb-4 text-xl font-semibold">{t('statistics.title')}</h2>

        {/* Stats loading */}
        {statsQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('common.loading')}
          </div>
        )}

        {/* Stats error */}
        {statsQuery.isError && (
          <p className="text-sm text-destructive">{t('common.error')}</p>
        )}

        {/* No matches yet */}
        {statsQuery.data && statsQuery.data.matchesPlayed === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('statistics.noMatchesYet')}
          </p>
        )}

        {/* Stats grid */}
        {statsQuery.data && statsQuery.data.matchesPlayed > 0 && (
          <StatsGrid stats={statsQuery.data} />
        )}
      </section>
    </div>
  )
}
