import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Pencil, Archive } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardFooter } from '@/shared/components/ui/card'
import { formatSessionDate, formatSessionTime } from '../utils'
import type { Session } from '../types'

interface SessionCardProps {
  session: Session
  onEdit: (session: Session) => void
  onArchive: (session: Session) => void
}

export function SessionCard({ session, onEdit, onArchive }: SessionCardProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const handleCardClick = () => {
    void navigate(`/sessions/${session.id}`)
  }

  return (
    <Card
      className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
      onClick={handleCardClick}
      role="link"
      aria-label={session.name}
    >
      <CardContent className="flex flex-1 flex-col gap-2 pt-6">
        <p className="font-semibold leading-none">{session.name}</p>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {formatSessionDate(session.scheduled_at, i18n.language)}
            {' – '}
            {formatSessionTime(session.scheduled_at, i18n.language)}
          </span>
        </div>

        {session.notes && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {session.notes}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(session)
          }}
          aria-label={`${t('sessions.editSession')}: ${session.name}`}
        >
          <Pencil className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('sessions.editSession')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onArchive(session)
          }}
          aria-label={`${t('sessions.archiveSession')}: ${session.name}`}
        >
          <Archive className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {t('sessions.archiveSession')}
        </Button>
      </CardFooter>
    </Card>
  )
}
