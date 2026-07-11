import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import type { PlayerOverviewStats } from '../types/player-history'

interface PlayerOverviewCardsProps {
  overview: PlayerOverviewStats
}

/** Section 2 — summary cards only, no charts (Section 10: "Cards first"). */
export function PlayerOverviewCards({ overview }: PlayerOverviewCardsProps) {
  const { t } = useTranslation()

  const streakLabel = overview.currentStreak.outcome === null
    ? t('players.profile.overview.noStreak')
    : `${overview.currentStreak.count}${overview.currentStreak.outcome}`

  const stats = [
    { label: t('players.profile.sessionsAttended'), value: overview.sessionsAttended },
    { label: t('statistics.matchesPlayed'), value: overview.matchesPlayed },
    { label: t('statistics.matchesWon'), value: overview.wins },
    { label: t('statistics.matchesLost'), value: overview.losses },
    { label: t('players.profile.overview.draws'), value: overview.draws },
    { label: t('statistics.gamesWon'), value: overview.gamesWon },
    { label: t('statistics.gamesLost'), value: overview.gamesLost },
    { label: t('statistics.matchWinPercentage'), value: `${overview.winPercentage}%` },
    { label: t('players.profile.overview.attendancePercentage'), value: `${overview.attendancePercentage}%` },
    { label: t('players.profile.overview.currentStreak'), value: streakLabel },
    { label: t('players.profile.overview.longestStreak'), value: overview.longestStreak },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="text-2xl font-bold tabular-nums">{stat.value}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {stat.label}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
