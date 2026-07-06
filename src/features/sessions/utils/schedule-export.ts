import { renderNodeToCanvas, canvasToBlob, downloadBlob, exportNodeToPdf } from '@/shared/export'

/**
 * Export the printable schedule (see components/SchedulePrintout.tsx) to
 * PDF, PNG, or JPEG. Rasterizes the dedicated printable DOM node — never
 * the live Planning UI — so the exported file never contains buttons,
 * toolbars, or controls.
 *
 * Sprint E1: delegates to the shared Export & Sharing module instead of
 * duplicating canvas/PDF-paging logic — this file is now just the
 * schedule-specific filename/format adapter. `html2canvas`/`jspdf` are
 * dynamically imported inside that shared module, so they still only load
 * the first time an export actually runs, exactly as before.
 */

export async function exportScheduleToPng(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderNodeToCanvas(node)
  const blob   = await canvasToBlob(canvas, 'image/png')
  downloadBlob(blob, filename)
}

export async function exportScheduleToJpeg(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderNodeToCanvas(node)
  const blob   = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  downloadBlob(blob, filename)
}

export async function exportScheduleToPdf(node: HTMLElement, filename: string): Promise<void> {
  await exportNodeToPdf(node, filename)
}
