import { useRef, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { ShareReportButton } from '@/shared/export'
import type { ExportSource } from '@/shared/export'
import { getFormat } from '@/features/sessions/formats'
import { usePlayerProfile } from '../hooks/usePlayerProfile'
import { PlayerProfileHeader } from '../components/PlayerProfileHeader'
import { PlayerOverviewCards } from '../components/PlayerOverviewCards'
import { PlayerHistoryFiltersBar } from '../components/PlayerHistoryFiltersBar'
import { PlayerSessionHistoryTable } from '../components/PlayerSessionHistoryTable'
import { PlayerMatchHistoryTable } from '../components/PlayerMatchHistoryTable'
import { PlayerUpcomingMatchesTable } from '../components/PlayerUpcomingMatchesTable'
import { PlayerPartnerHistoryTable } from '../components/PlayerPartnerHistoryTable'
import { PlayerOpponentHistoryTable } from '../components/PlayerOpponentHistoryTable'
import { PlayerAttendanceSection } from '../components/PlayerAttendanceSection'
import { EMPTY_PLAYER_HISTORY_FILTERS, filterMatchHistory } from '../utils/apply-history-filters'
import type { PlayerHistoryFilters } from '../utils/apply-history-filters'
import { buildPlayerSummaryText } from '../utils/player-summary'

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'player'
}

/**
 * Player Profile & History (Sprint H1). Read-only, like Session Reports:
 * every hook this page uses is a query. Export & Sharing is reused as-is
 * (implements `ExportSource`, renders `<ShareReportButton>`) — no export
 * logic of its own.
 */
export function PlayerProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { playerId } = useParams<{ playerId: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<PlayerHistoryFilters>(EMPTY_PLAYER_HISTORY_FILTERS)

  const { isLoading, isError, refetch, player, profile } = usePlayerProfile(playerId ?? '')

  if (!playerId) return <Navigate to="/players" replace />

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" aria-label={t('common.loading')} />
      </div>
    )
  }

  if (isError || !player) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t('common.error')}</p>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  const sessionOptions = [...new Map(profile.sessionHistory.map(s => [s.sessionId, s.sessionName])).entries()]
    .map(([id, name]) => ({ id, name }))
  const formatOptions = [...new Set(profile.sessionHistory.map(s => s.formatId).filter((f): f is string => f !== null))]
    .map(id => ({ id, name: getFormat(id)?.name ?? id }))
  const partnerOptions  = profile.partners.map(p => ({ id: p.partnerId, name: p.partnerName }))
  const opponentOptions = profile.opponents.map(o => ({ id: o.opponentId, name: o.opponentName }))

  const filteredMatchHistory = filterMatchHistory(profile.matchHistory, filters)

  const exportSource: ExportSource = {
    getNode: () => reportRef.current,
    filename: `${slugify(player.name)}-profile`,
    getSummaryText: () => buildPlayerSummaryText(player, profile),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" className="-ms-2" onClick={() => void navigate('/players')}>
          <ArrowLeft className="me-1.5 h-4 w-4" aria-hidden="true" />
          {t('players.detail.backToPlayers')}
        </Button>
        <ShareReportButton source={exportSource} />
      </div>

      <div ref={reportRef} className="space-y-6">
        <PlayerProfileHeader player={player} overview={profile.overview} />

        <Separator />

        <PlayerOverviewCards overview={profile.overview} />

        {profile.overview.sessionsAttended === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('players.profile.neverAttended')}</p>
        ) : (
          <>
            <div className="print:hidden">
              <PlayerHistoryFiltersBar
                filters={filters}
                onChange={setFilters}
                sessions={sessionOptions}
                formats={formatOptions}
                partners={partnerOptions}
                opponents={opponentOptions}
              />
            </div>

            <PlayerSessionHistoryTable sessions={profile.sessionHistory} />
            <PlayerUpcomingMatchesTable matches={profile.upcomingMatches} />
            <PlayerMatchHistoryTable matches={filteredMatchHistory} />
            <PlayerPartnerHistoryTable partners={profile.partners} />
            <PlayerOpponentHistoryTable opponents={profile.opponents} />
            <PlayerAttendanceSection attendance={profile.attendance} />
          </>
        )}
      </div>
    </div>
  )
}
