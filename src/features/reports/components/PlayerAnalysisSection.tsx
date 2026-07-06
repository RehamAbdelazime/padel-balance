import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { PlayerAnalysis } from '../types'

interface PlayerAnalysisSectionProps {
  playerAnalysis: readonly PlayerAnalysis[]
}

/**
 * Sections 4 & 5 — Partner Analysis and Opponent Analysis, combined into one
 * per-player card since both describe the same player's relationships
 * within this session.
 */
export function PlayerAnalysisSection({ playerAnalysis }: PlayerAnalysisSectionProps) {
  const { t } = useTranslation()

  const withData = playerAnalysis.filter(p => p.partners.length > 0 || p.opponents.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('reports.analysis.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {withData.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('reports.analysis.empty')}</p>
        ) : (
          withData.map(player => (
            <div key={player.playerId} className="space-y-3">
              <h3 className="text-sm font-semibold">{player.name}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('reports.analysis.partners')}
                  </p>
                  {player.partners.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('reports.analysis.noPartners')}</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {player.partners.map(partner => (
                        <li key={partner.partnerId} className="flex items-center justify-between gap-2">
                          <span>{partner.partnerName}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {t('reports.analysis.matchesTogether', { count: partner.matchesTogether })} · {partner.winRateTogether}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('reports.analysis.opponents')}
                  </p>
                  {player.opponents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('reports.analysis.noOpponents')}</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {player.opponents.map(opponent => (
                        <li key={opponent.opponentId} className="flex items-center justify-between gap-2">
                          <span>{opponent.opponentName}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {t('reports.analysis.timesPlayed', { count: opponent.timesPlayed })} · {opponent.wins}W–{opponent.losses}L
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
