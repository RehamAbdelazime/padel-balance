/**
 * Rasterization primitives shared by PDF and Image export. `html2canvas` is
 * dynamically imported here — the only place it's imported at all — so no
 * page that merely renders an ExportSource pulls it into its own chunk
 * (Sprint E1 Step 7). It only loads the first time a PDF/Image export
 * actually runs.
 */

const EXPORT_SCALE = 3 // high-resolution output for crisp text in PDFs and images

export async function renderNodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')

  const canvas = await html2canvas(node, {
  scale: EXPORT_SCALE,
  backgroundColor: "#fff",
  useCORS: true,
  logging: true,

  onclone: (doc) => {
    console.log(
      "Badge font:",
      getComputedStyle(doc.querySelector("[class*='rounded-full']")!).fontFamily
    )
  },
})

  console.log('Canvas size:', canvas.width, canvas.height)

  document.body.appendChild(canvas) // <-- أضيفي هذا السطر مؤقتًا

  return canvas
}
export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error(`Failed to encode canvas as ${type}.`))
    }, type, quality)
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
