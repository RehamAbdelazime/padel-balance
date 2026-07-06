import { useTranslation } from 'react-i18next'
import { LayoutDashboard } from 'lucide-react'

/**
 * Dashboard page — placeholder pending the Dashboard & Reports sprint.
 *
 * A future sprint will add: summary cards, recent activity feed, quick
 * actions. No business logic lives here — this component is purely
 * presentational. Until then, this shows an honest "coming soon" empty
 * state rather than a blank page (Sprint R1).
 */
export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.title')}
        </h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <LayoutDashboard className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t('dashboard.empty.title')}</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t('dashboard.empty.description')}
          </p>
        </div>
      </div>
    </div>
  )
}
