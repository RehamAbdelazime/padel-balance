import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { PlayerPartnerHistoryStat } from '../types/player-history'

interface PlayerPartnerHistoryTableProps {
  partners: readonly PlayerPartnerHistoryStat[]
}

/** Section 5 — every partner this player has ever been teamed with. */
export function PlayerPartnerHistoryTable({ partners }: PlayerPartnerHistoryTableProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('players.profile.partners.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('players.profile.partners.empty')}</p>
        ) : (
          <ul className="divide-y">
            {partners.map(partner => (
              <li key={partner.partnerId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium">{partner.partnerName}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t('players.profile.partners.matchesTogether')}: {partner.matchesTogether}
                  {' · '}{t('players.profile.partners.winRate')}: {partner.winRateTogether}%
                  {partner.lastPlayedTogether && (
                    <> · {t('players.profile.partners.lastPlayed')}: {new Date(partner.lastPlayedTogether).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}</>
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
