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
import { Button } from '@/shared/components/ui/button'
import { postponeSessionSchema, type PostponeSessionValues } from '../schemas'
import { usePostponeSessionMutation } from '../hooks/useSessions'
import { toDatetimeLocalValue } from '../utils'
import type { Session } from '../types'

interface Props {
  session: Session | null
  open:    boolean
  onClose: () => void
}

/**
 * Lets the organiser change the scheduled date/time while still in PLANNING —
 * never touches the (client-only) schedule.
 */
export function PostponeSessionDialog({ session, open, onClose }: Props) {
  const { t } = useTranslation()
  const postponeMutation = usePostponeSessionMutation()

  const form = useForm<PostponeSessionValues, unknown, PostponeSessionValues>({
    resolver: zodResolver(postponeSessionSchema),
    defaultValues: { scheduled_at: '' },
  })

  useEffect(() => {
    if (open && session) {
      form.reset({ scheduled_at: toDatetimeLocalValue(session.scheduled_at) })
    }
  }, [open, session, form])

  const handleSubmit = form.handleSubmit(values => {
    if (!session) return
    postponeMutation.mutate(
      { id: session.id, input: { scheduled_at: values.scheduled_at } },
      { onSuccess: onClose },
    )
  })

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.lifecycle.postponeTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={postponeMutation.isPending}
              >
                {t('sessions.form.cancel')}
              </Button>
              <Button type="submit" disabled={postponeMutation.isPending}>
                {postponeMutation.isPending
                  ? t('sessions.form.saving')
                  : t('sessions.lifecycle.postponeConfirm')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
