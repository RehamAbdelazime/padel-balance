import type { Session } from '@/features/sessions/types'
import type { SessionReportData } from '../types'

/**
 * Copy Summary's plain-text content (Sprint E1 Step 5). No single "winner"
 * line: every built-in format rotates partners match by match (see R2's
 * RecentSessionsList reasoning), so a session has no one winning
 * player/team — "Most Active" and "Best Win Rate" are the real, computed
 * substitutes.
 */
export function buildReportSummaryText(session: Session, report: SessionReportData): string {
  const lines: string[] = ['Session:', session.name, '', 'Players:', String(report.totalPlayers), '', 'Rounds:', String(report.totalRounds), '']

  if (report.insights.mostActivePlayer) {
    lines.push('Most Active:', report.insights.mostActivePlayer.name, '')
  }
  if (report.insights.bestWinPercentage) {
    lines.push('Best Win Rate:', `${report.insights.bestWinPercentage.name} (${report.insights.bestWinPercentage.winPercentage}%)`, '')
  }

  lines.push('Matches:', String(report.totalMatches))

  return lines.join('\n')
}
