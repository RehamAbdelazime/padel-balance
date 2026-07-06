import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'

interface ConfirmActionDialogProps {
  open:         boolean
  title:        string
  description:  string
  confirmLabel: string
  cancelLabel:  string
  /** True while the confirmed action's mutation is in flight — disables both buttons. */
  isPending?:   boolean
  onConfirm:    () => void
  onClose:      () => void
}

/**
 * One shared confirmation dialog for every destructive/hard-to-reverse
 * schedule/session action (Finish Session, Regenerate All, Remove Manual
 * Match) — these all need the exact same title/description/confirm/cancel
 * shape, so this is the single implementation rather than three near-
 * identical AlertDialog wrappers (Sprint R1).
 */
export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
