import { renderNodeToCanvas } from './canvas'

/**
 * Create a PDF from the same print-style snapshot that the browser print preview uses.
 * This keeps layout, colors, and spacing close to the visible print output instead of
 * depending on a rasterized slice that can lose fidelity.
 */
export async function exportNodeToPdf(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderNodeToCanvas(node)
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidthMm = pdf.internal.pageSize.getWidth()
  const pageHeightMm = pdf.internal.pageSize.getHeight()
  const pxPerMm = canvas.width / pageWidthMm
  const pageHeightPx = Math.floor(pageHeightMm * pxPerMm)

  let renderedPx = 0
  let isFirstPage = true

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx

    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('exportNodeToPdf: could not acquire 2D canvas context.')

    ctx.drawImage(
      canvas,
      0,
      renderedPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    )

    const sliceImage = pageCanvas.toDataURL('image/png')
    const sliceHeightMm = sliceHeightPx / pxPerMm

    if (!isFirstPage) pdf.addPage()
    pdf.addImage(sliceImage, 'PNG', 0, 0, pageWidthMm, sliceHeightMm, undefined, 'FAST')

    renderedPx += sliceHeightPx
    isFirstPage = false
  }

  pdf.save(filename)
}
