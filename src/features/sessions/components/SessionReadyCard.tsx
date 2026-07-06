import { useTranslation } from 'react-i18next'
import { Shuffle, Users, Hash } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

interface Props {
  playerCount: number
  matchesRecorded: number
  onGenerate: () => void
}

export function SessionReadyCard({ playerCount, matchesRecorded, onGenerate }: Props) {
  const { t } = useTranslation()

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col items-center gap-6 py-10 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            {t('sessions.generation.readyCard.title')}
          </h2>

          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:gap-4">
            <span className="flex items-center justify-center gap-1.5 sm:justify-start">
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('sessions.generation.readyCard.players', { count: playerCount })}
            </span>
            <span className="flex items-center justify-center gap-1.5 sm:justify-start">
              <Hash className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('sessions.generation.readyCard.recorded', { count: matchesRecorded })}
            </span>
          </div>
        </div>

        <Button size="lg" onClick={onGenerate} className="shrink-0">
          <Shuffle className="me-2 h-5 w-5" aria-hidden="true" />
          {t('sessions.generation.readyCard.cta')}
        </Button>
      </CardContent>
    </Card>
  )
}
