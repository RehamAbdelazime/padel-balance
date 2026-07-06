import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { sessionFormSchema, type SessionFormValues } from '../schemas'
import { useCreateSessionMutation, useUpdateSessionMutation } from '../hooks/useSessions'
import { toDatetimeLocalValue } from '../utils'
import type { Session } from '../types'

interface SessionFormDialogProps {
  /** null = create mode, Session = edit mode */
  session: Session | null
  open: boolean
  onClose: () => void
}

/** Next quarter-hour, as a `<input type="datetime-local">` value — a sensible default for a new session. */
function getDefaultScheduledAt(): string {
  const d = new Date()
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  return toDatetimeLocalValue(d.toISOString())
}

const DEFAULT_VALUES: SessionFormValues = {
  name: '',
  scheduled_at: getDefaultScheduledAt(),
  court_count: 1,
  booking_duration: 90,
  notes: undefined,
}

export function SessionFormDialog({
  session,
  open,
  onClose,
}: SessionFormDialogProps) {
  const { t } = useTranslation()
  const isEditMode = session !== null

  const createMutation = useCreateSessionMutation()
  const updateMutation = useUpdateSessionMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<SessionFormValues, unknown, SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (isEditMode && session) {
      form.reset({
        name: session.name,
        scheduled_at: toDatetimeLocalValue(session.scheduled_at),
        court_count: session.court_count,
        booking_duration: session.booking_duration,
        notes: session.notes ?? undefined,
      })
    } else {
      form.reset({ ...DEFAULT_VALUES, scheduled_at: getDefaultScheduledAt() })
    }
  }, [open, isEditMode, session, form])

  const handleSubmit = form.handleSubmit((values) => {
    const input = {
      name: values.name.trim(),
      scheduled_at: values.scheduled_at,
      court_count: values.court_count,
      booking_duration: values.booking_duration,
      notes: values.notes?.trim() || null,
    }

    if (isEditMode && session) {
      updateMutation.mutate({ id: session.id, input }, { onSuccess: onClose })
    } else {
      createMutation.mutate(input, { onSuccess: onClose })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('sessions.editSession') : t('sessions.addSession')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('sessions.form.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & Time */}
            <FormField
              control={form.control}
              name="scheduled_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.form.scheduledAt')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of courts + Court Booking Duration — both session-level settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="court_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sessions.form.courtCount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="booking_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sessions.form.bookingDuration')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={15}
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sessions.form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('sessions.form.notesPlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {t('sessions.form.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('sessions.form.saving') : t('sessions.form.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
