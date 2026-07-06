import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import type { SessionInsights } from '../types'

interface SessionInsightsCardsProps {
  insights:   SessionInsights
  playerName: (id: string) => string
}

/** Section 6 — plain summary cards only, no charts/graphs (those belong to a future analytics sprint, if any). */
export function SessionInsightsCards({ insights, playerName }: SessionInsightsCardsProps) {
  const { t } = useTranslation()

  const cards: Array<{ label: string; value: string } | null | false> = [
    insights.mostActivePlayer && {
      label: t('reports.insights.mostActivePlayer'),
      value: `${insights.mostActivePlayer.name} (${insights.mostActivePlayer.matchesPlayed})`,
    },
    insights.bestWinPercentage && {
      label: t('reports.insights.bestWinPercentage'),
      value: `${insights.bestWinPercentage.name} (${insights.bestWinPercentage.winPercentage}%)`,
    },
    insights.closestMatch && insights.closestMatch.scoreA !== null && insights.closestMatch.scoreB !== null && {
      label: t('reports.insights.closestMatch'),
      value: `${playerName(insights.closestMatch.teamA[0])} & ${playerName(insights.closestMatch.teamA[1])} ${t('matches.vs')} ${playerName(insights.closestMatch.teamB[0])} & ${playerName(insights.closestMatch.teamB[1])} (${insights.closestMatch.scoreA}–${insights.closestMatch.scoreB})`,
    },
    insights.biggestVictory && insights.biggestVictory.scoreA !== null && insights.biggestVictory.scoreB !== null && {
      label: t('reports.insights.biggestVictory'),
      value: `${playerName(insights.biggestVictory.teamA[0])} & ${playerName(insights.biggestVictory.teamA[1])} ${t('matches.vs')} ${playerName(insights.biggestVictory.teamB[0])} & ${playerName(insights.biggestVictory.teamB[1])} (${insights.biggestVictory.scoreA}–${insights.biggestVictory.scoreB})`,
    },
    insights.longestWinningStreak && {
      label: t('reports.insights.longestWinningStreak'),
      value: `${insights.longestWinningStreak.name} (${insights.longestWinningStreak.streak})`,
    },
    insights.mostUsedPartnerCombination && {
      label: t('reports.insights.mostUsedPartnerCombination'),
      value: `${insights.mostUsedPartnerCombination.playerAName} & ${insights.mostUsedPartnerCombination.playerBName} (${insights.mostUsedPartnerCombination.matchesTogether})`,
    },
  ]

  const visibleCards = cards.filter((c): c is { label: string; value: string } => c !== null && c !== false)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleCards.length === 0 ? (
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('reports.insights.empty')}
          </CardContent>
        </Card>
      ) : (
        visibleCards.map(card => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-sm font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
