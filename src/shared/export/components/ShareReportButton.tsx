import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Share2, FileText, Image as ImageIcon, Printer, Clipboard } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { exportNodeToPdf } from '../pdf'
import { exportNodeToImage } from '../image'
import { printCurrentPage } from '../print'
import { copyTextToClipboard } from '../clipboard'
import { friendlyExportErrorMessage } from '../errors'
import type { ExportSource, ExportAction } from '../types'

interface ShareReportButtonProps {
  source: ExportSource
}

/**
 * The single reusable "Share Report" entry point (Sprint E1). Any page
 * implementing `ExportSource` gets PDF/Image/Print/Copy for free — no
 * export logic lives in the page itself. `pdf.ts`/`image.ts` are statically
 * imported here (they're thin wrappers with no heavy top-level imports of
 * their own), but the actual heavy libraries (html2canvas, jspdf) are only
 * ever dynamically imported inside them — they don't load until the
 * matching button is clicked, not merely when this dialog opens.
 */
export function ShareReportButton({ source }: ShareReportButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<ExportAction | null>(null)

  async function run(action: ExportAction) {
    setPending(action)
    try {
      switch (action) {
        case 'pdf': {
          const node = source.getNode()
          if (!node) throw new Error('Nothing to export yet.')
          await exportNodeToPdf(node, `${source.filename}.pdf`)
          toast.success(t('export.toasts.exported'))
          setOpen(false)
          break
        }
        case 'image': {
          const node = source.getNode()
          if (!node) throw new Error('Nothing to export yet.')
          await exportNodeToImage(node, `${source.filename}.png`)
          toast.success(t('export.toasts.exported'))
          setOpen(false)
          break
        }
        case 'print': {
          setOpen(false)
          requestAnimationFrame(() => {
            printCurrentPage()
          })
          break
        }
        case 'copy': {
          await copyTextToClipboard(source.getSummaryText())
          toast.success(t('export.toasts.copied'))
          setOpen(false)
          break
        }
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e)
      toast.error(friendlyExportErrorMessage(raw, t('export.toasts.failed')))
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 className="me-1.5 h-4 w-4" aria-hidden="true" />
        {t('export.shareReport')}
      </Button>

      <Dialog open={open} onOpenChange={isOpen => !pending && setOpen(isOpen)}>
        <DialogContent className="sm:max-w-sm print:hidden">
          <DialogHeader>
            <DialogTitle>{t('export.shareReport')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start" disabled={pending !== null} onClick={() => void run('pdf')}>
              <FileText className="me-2 h-4 w-4" aria-hidden="true" />
              {pending === 'pdf' ? t('export.actions.exporting') : t('export.actions.downloadPdf')}
            </Button>
            <Button variant="outline" className="justify-start" disabled={pending !== null} onClick={() => void run('image')}>
              <ImageIcon className="me-2 h-4 w-4" aria-hidden="true" />
              {pending === 'image' ? t('export.actions.exporting') : t('export.actions.downloadImage')}
            </Button>
            <Button variant="outline" className="justify-start" disabled={pending !== null} onClick={() => void run('print')}>
              <Printer className="me-2 h-4 w-4" aria-hidden="true" />
              {t('export.actions.print')}
            </Button>
            <Button variant="outline" className="justify-start" disabled={pending !== null} onClick={() => void run('copy')}>
              <Clipboard className="me-2 h-4 w-4" aria-hidden="true" />
              {pending === 'copy' ? t('export.actions.copying') : t('export.actions.copySummary')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
