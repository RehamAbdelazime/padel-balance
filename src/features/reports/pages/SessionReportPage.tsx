import { useRef, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ShareReportButton } from '@/shared/export'
import type { ExportSource } from '@/shared/export'
import { useSessionAttendanceQuery } from '@/features/sessions/hooks/useAttendance'
import { useSessionReport } from '../hooks/useSessionReport'
import { SessionReportHeader } from '../components/SessionReportHeader'
import { ReportFilters } from '../components/ReportFilters'
import { MatchResultsSection } from '../components/MatchResultsSection'
import { PlayerPerformanceTable } from '../components/PlayerPerformanceTable'
import { PlayerAnalysisSection } from '../components/PlayerAnalysisSection'
import { SessionInsightsCards } from '../components/SessionInsightsCards'
import { filterRounds, filterPlayers, EMPTY_REPORT_FILTERS } from '../utils/apply-filters'
import type { ReportFiltersState } from '../utils/apply-filters'
import { buildReportSummaryText } from '../utils/report-summary'

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'session'
}

/**
 * Session Report — read-only. Nothing on this page can mutate the session,
 * its schedule, or its runtime state (Sprint R2): every hook it uses is a
 * query, never a mutation.
 *
 * Export & Sharing (Sprint E1): this page implements `ExportSource` and
 * renders `<ShareReportButton>` — it contains zero export logic of its own.
 * `reportRef` wraps the entire printable report in one clean container (no
 * buttons/nav inside it); `print:hidden` on the filter bar, back button,
 * and the Share button itself means a browser print of this page already
 * shows only the report content.
 */
export function SessionReportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const reportRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<ReportFiltersState>(EMPTY_REPORT_FILTERS)

  const { isLoading, isError, refetch, session, formatId, hasSchedule, report, estimatedMatchDurationMinutes } =
    useSessionReport(sessionId ?? '')
  const attendanceQuery = useSessionAttendanceQuery(sessionId ?? '')

  const attendees = attendanceQuery.data ?? []
  const playerName = (id: string) => attendees.find(a => a.player_id === id)?.players.name ?? id

  const roundNumbers = report.rounds.map(r => r.roundNumber)
  const courtNumbers = [
    ...new Set(report.rounds.flatMap(r => r.matches.map(m => m.courtNumber).filter((c): c is number => c !== null))),
  ].sort((a, b) => a - b)
  const filterPlayerOptions = report.players.map(p => ({ id: p.playerId, name: p.name }))

  const filteredRounds  = filterRounds(report.rounds, filters, playerName)
  const filteredPlayers = filterPlayers(report.players, filters)

  if (!sessionId) return <Navigate to="/sessions" replace />

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" aria-label={t('common.loading')} />
      </div>
    )
  }

  if (isError || !session) {
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

  const exportSource: ExportSource = {
    getNode: () => reportRef.current,
    filename: `${slugify(session.name)}-report`,
    getSummaryText: () => buildReportSummaryText(session, report),
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => void navigate(`/sessions/${sessionId}`)}>
          <ArrowLeft className="me-1.5 h-4 w-4" aria-hidden="true" />
          {t('sessions.detail.backToSessions')}
        </Button>
        <ShareReportButton source={exportSource} />
      </div>

      <div ref={reportRef} className="space-y-6">
        <SessionReportHeader
          session={session}
          formatId={formatId}
          totalPlayers={report.totalPlayers}
          totalMatches={report.totalMatches}
          totalRounds={report.totalRounds}
          estimatedMatchDurationMinutes={estimatedMatchDurationMinutes}
        />

        {!hasSchedule ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t('reports.session.noSchedule')}</p>
        ) : (
          <>
            <div className="print:hidden">
              <ReportFilters
                filters={filters}
                onChange={setFilters}
                players={filterPlayerOptions}
                roundNumbers={roundNumbers}
                courtNumbers={courtNumbers}
              />
            </div>

            <SessionInsightsCards insights={report.insights} playerName={playerName} />
            <MatchResultsSection rounds={filteredRounds} playerName={playerName} />
            <PlayerPerformanceTable players={filteredPlayers} />
            <PlayerAnalysisSection playerAnalysis={report.playerAnalysis} />
          </>
        )}
      </div>
    </div>
  )
}
