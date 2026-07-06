import { renderNodeToCanvas, canvasToBlob, downloadBlob } from './canvas'

/**
 * High-resolution PNG (see EXPORT_SCALE in canvas.ts) — crisp text and no
 * lossy compression, suitable for sharing on WhatsApp/Telegram/Discord/
 * Facebook/Instagram alike (Sprint E1 Step 3). Long content (many rounds)
 * is never cropped — the canvas is exactly as tall as the source node.
 */
export async function exportNodeToImage(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderNodeToCanvas(node)
  const blob   = await canvasToBlob(canvas, 'image/png')
  downloadBlob(blob, filename)
}
