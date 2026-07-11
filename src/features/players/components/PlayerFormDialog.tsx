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
import { playerFormSchema, type PlayerFormValues } from '../schemas'
import { useCreatePlayerMutation, useUpdatePlayerMutation } from '../hooks/usePlayers'
import type { Player } from '../types'

interface PlayerFormDialogProps {
  /** null = create mode, Player = edit mode */
  player: Player | null
  open: boolean
  onClose: () => void
}

const DEFAULT_VALUES: PlayerFormValues = {
  name: '',
  phone: undefined,
}

/** Normalises an optional string field: empty or whitespace-only → undefined. */
function normaliseOptional(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') return undefined
  return value.trim()
}

export function PlayerFormDialog({ player, open, onClose }: PlayerFormDialogProps) {
  const { t } = useTranslation()
  const isEditMode = player !== null

  const createMutation = useCreatePlayerMutation()
  const updateMutation = useUpdatePlayerMutation()
  const isPending = createMutation.isPending || updateMutation.isPending

  /**
   * Explicit third generic `PlayerFormValues` as `TTransformedValues` is
   * required in react-hook-form v7.80+ when using zodResolver with Zod v4,
   * to align the `Control` type with what `FormField` expects.
   */
  const form = useForm<PlayerFormValues, unknown, PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /** Reset form whenever the dialog opens. */
  useEffect(() => {
    if (!open) return
    if (isEditMode && player) {
      form.reset({
        name: player.name,
        phone: player.phone ?? undefined,
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [open, isEditMode, player, form])

  const handleSubmit = form.handleSubmit((values) => {
    const normalisedInput = {
      name: values.name.trim(),
      phone: normaliseOptional(values.phone) ?? null,
    }

    if (isEditMode && player) {
      updateMutation.mutate(
        { id: player.id, input: normalisedInput },
        { onSuccess: onClose },
      )
    } else {
      createMutation.mutate(normalisedInput, { onSuccess: onClose })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-xl p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('players.editPlayer') : t('players.addPlayer')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('players.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('players.form.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('players.form.phone')}</FormLabel>
                  <FormControl>
                    <Input className="h-12"
                      type="tel"
                      placeholder={t('players.form.phonePlaceholder')}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {t('players.form.cancel')}
              </Button>
              <Button className="min-w-24" type="submit" disabled={isPending}>
                {isPending ? t('players.form.saving') : t('players.form.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
