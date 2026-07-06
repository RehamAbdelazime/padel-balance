import type { Player } from '../types'
import type { PlayerProfileData } from '../types/player-history'

/** Copy Summary's plain-text content (reuses the shared Export module — Sprint H1). */
export function buildPlayerSummaryText(player: Player, profile: PlayerProfileData): string {
  const lines: string[] = [
    'Player:', player.name, '',
    'Sessions Attended:', String(profile.overview.sessionsAttended), '',
    'Matches Played:', String(profile.overview.matchesPlayed), '',
    'Wins:', String(profile.overview.wins), '',
    'Losses:', String(profile.overview.losses), '',
    'Win %:', `${profile.overview.winPercentage}%`, '',
    'Attendance %:', `${profile.overview.attendancePercentage}%`,
  ]
  return lines.join('\n')
}
