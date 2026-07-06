import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { PlayerOpponentHistoryStat } from '../types/player-history'

interface PlayerOpponentHistoryTableProps {
  opponents: readonly PlayerOpponentHistoryStat[]
}

/** Section 6 — every opponent this player has ever faced. */
export function PlayerOpponentHistoryTable({ opponents }: PlayerOpponentHistoryTableProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('players.profile.opponents.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {opponents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('players.profile.opponents.empty')}</p>
        ) : (
          <ul className="divide-y">
            {opponents.map(opponent => (
              <li key={opponent.opponentId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium">{opponent.opponentName}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t('players.profile.opponents.matches')}: {opponent.matches}
                  {' · '}{opponent.wins}W–{opponent.losses}L
                  {opponent.lastPlayed && (
                    <> · {t('players.profile.opponents.lastPlayed')}: {new Date(opponent.lastPlayed).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
