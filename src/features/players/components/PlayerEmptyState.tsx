import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface PlayerEmptyStateProps {
  onAdd: () => void
}

export function PlayerEmptyState({ onAdd }: PlayerEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <UserPlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t('players.empty.title')}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t('players.empty.description')}
        </p>
      </div>
      <Button onClick={onAdd}>
        <UserPlus className="me-2 h-4 w-4" aria-hidden="true" />
        {t('players.empty.action')}
      </Button>
    </div>
  )
}
