import { useTranslation } from 'react-i18next'
import { Circle } from 'lucide-react'
import { APP_VERSION } from '../constants'

interface SystemHealthCardProps {
  isDbConnected: boolean
  /** TanStack Query's `dataUpdatedAt` for the sessions query — 0 before the first successful fetch. */
  lastSyncAt: number
}

/**
 * Section 7 — subtle, developer-facing status line, not a dashboard
 * headline. `isDbConnected`/`lastSyncAt` are real signals (query error
 * state / real fetch timestamp), not simulated.
 */
export function SystemHealthCard({ isDbConnected, lastSyncAt }: SystemHealthCardProps) {
  const { t } = useTranslation()

  const lastSyncLabel = lastSyncAt > 0 ? new Date(lastSyncAt).toLocaleTimeString() : t('dashboard.systemHealth.never')

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Circle
          className={`h-2 w-2 shrink-0 fill-current ${isDbConnected ? 'text-green-500' : 'text-destructive'}`}
          aria-hidden="true"
        />
        {isDbConnected ? t('dashboard.systemHealth.dbConnected') : t('dashboard.systemHealth.dbIssue')}
      </span>
      <span>{t('dashboard.systemHealth.lastSync')}: {lastSyncLabel}</span>
      <span>{t('dashboard.systemHealth.version')}: {APP_VERSION}</span>
    </div>
  )
}
