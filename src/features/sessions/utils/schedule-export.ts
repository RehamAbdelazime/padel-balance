import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Export the printable schedule (see components/SchedulePrintout.tsx) to
 * PDF, PNG, or JPEG. Rasterizes the dedicated printable DOM node with
 * html2canvas — never the live Planning UI — so the exported file never
 * contains buttons, toolbars, or controls.
 */

const EXPORT_SCALE = 2 // high-resolution output for PNG/JPEG and crisp PDF embedding

async function renderToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(node, {
    scale:           EXPORT_SCALE,
    backgroundColor: '#ffffff',
    useCORS:         true,
  })
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error(`Failed to encode canvas as ${type}.`))
    }, type, quality)
  })
}

export async function exportScheduleToPng(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderToCanvas(node)
  const blob   = await canvasToBlob(canvas, 'image/png')
  downloadBlob(blob, filename)
}

export async function exportScheduleToJpeg(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderToCanvas(node)
  const blob   = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  downloadBlob(blob, filename)
}

/**
 * A4 portrait, sliced across as many pages as the content needs — a
 * schedule with many rounds is expected to overflow a single A4 page.
 */
export async function exportScheduleToPdf(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderToCanvas(node)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidthMm  = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()

  const pxPerMm       = canvas.width / pageWidthMm
  const pageHeightPx  = Math.floor(pageHeightMm * pxPerMm)

  let renderedPx = 0
  let isFirstPage = true

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width  = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('exportScheduleToPdf: could not acquire 2D canvas context.')
    ctx.drawImage(
      canvas,
      0, renderedPx, canvas.width, sliceHeightPx,
      0, 0, canvas.width, sliceHeightPx,
    )

    const sliceImage    = pageCanvas.toDataURL('image/png')
    const sliceHeightMm = sliceHeightPx / pxPerMm

    if (!isFirstPage) pdf.addPage()
    pdf.addImage(sliceImage, 'PNG', 0, 0, pageWidthMm, sliceHeightMm)

    renderedPx += sliceHeightPx
    isFirstPage = false
  }

  pdf.save(filename)
}
