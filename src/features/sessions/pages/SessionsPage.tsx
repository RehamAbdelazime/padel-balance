import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useSessionsQuery } from '../hooks/useSessions'
import { SessionCard } from '../components/SessionCard'
import { SessionEmptyState } from '../components/SessionEmptyState'
import { SessionFormDialog } from '../components/SessionFormDialog'
import { SessionArchiveDialog } from '../components/SessionArchiveDialog'
import type { Session } from '../types'

export function SessionsPage() {
  const { t } = useTranslation()
  const { data: sessions, isLoading, isError, refetch } = useSessionsQuery()

  const [formDialogSession, setFormDialogSession] = useState<Session | null>(null)
  const [isFormDialogOpen, setFormDialogOpen] = useState(false)
  const [archiveDialogSession, setArchiveDialogSession] = useState<Session | null>(null)
  const [isArchiveDialogOpen, setArchiveDialogOpen] = useState(false)

  const openCreateDialog = () => {
    setFormDialogSession(null)
    setFormDialogOpen(true)
  }
  const openEditDialog = (session: Session) => {
    setFormDialogSession(session)
    setFormDialogOpen(true)
  }
  const openArchiveDialog = (session: Session) => {
    setArchiveDialogSession(session)
    setArchiveDialogOpen(true)
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('sessions.title')}
          </h1>
          <p className="text-muted-foreground">{t('sessions.subtitle')}</p>
        </div>
        {!isLoading && !isError && (
          <Button onClick={openCreateDialog}>
            <CalendarPlus className="me-2 h-4 w-4" aria-hidden="true" />
            {t('sessions.addSession')}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t('common.loading')}
          />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t('common.error')}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!isLoading && !isError && sessions?.length === 0 && (
        <SessionEmptyState onAdd={openCreateDialog} />
      )}

      {!isLoading && !isError && (sessions?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sessions?.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={openEditDialog}
              onArchive={openArchiveDialog}
            />
          ))}
        </div>
      )}

      <SessionFormDialog
        session={formDialogSession}
        open={isFormDialogOpen}
        onClose={() => setFormDialogOpen(false)}
      />
      <SessionArchiveDialog
        session={archiveDialogSession}
        open={isArchiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
      />
    </>
  )
}
