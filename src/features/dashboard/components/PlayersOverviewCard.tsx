import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'

interface PlayersOverviewCardProps {
  total:          number
  active:         number
  archived:       number
  attendingToday: number
}

/** Section 6 — four simple counts, no charts/rankings (those belong to Reports). */
export function PlayersOverviewCard({ total, active, archived, attendingToday }: PlayersOverviewCardProps) {
  const { t } = useTranslation()

  const stats = [
    { label: t('dashboard.playersOverview.total'),          value: total },
    { label: t('dashboard.playersOverview.active'),         value: active },
    { label: t('dashboard.playersOverview.archived'),       value: archived },
    { label: t('dashboard.playersOverview.attendingToday'), value: attendingToday },
  ]

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
        {stats.map(stat => (
          <div key={stat.label}>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
