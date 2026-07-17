/**
 * Rasterization primitives shared by PDF and Image export. `html2canvas` is
 * dynamically imported here — the only place it's imported at all — so no
 * page that merely renders an ExportSource pulls it into its own chunk
 * (Sprint E1 Step 7). It only loads the first time a PDF/Image export
 * actually runs.
 */

const EXPORT_SCALE = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

export async function renderNodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')

  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready
  }

  const rect = node.getBoundingClientRect()
  const width = Math.max(1, Math.ceil(rect.width || node.clientWidth || node.offsetWidth || window.innerWidth))
  const height = Math.max(1, Math.ceil(rect.height || node.clientHeight || node.offsetHeight || window.innerHeight))

  const canvas = await html2canvas(node, {
    scale: EXPORT_SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: Math.max(window.innerWidth, width),
    windowHeight: Math.max(window.innerHeight, height),
    scrollX: 0,
    scrollY: 0,
    onclone: (doc, element) => {
      if (element instanceof HTMLElement) {
        element.setAttribute('data-export-root', 'true')
      }

      // ─── Single consolidated style block ───────────────────────────────────
      // All rules here are export-only: they are injected into the cloned
      // document that html2canvas rasterises, so the live UI is never touched.
      const style = doc.createElement('style')
      style.textContent = `
        /* ── Export root ────────────────────────────────────────────────── */
        /*
         * Establish a stacking context and enable sub-pixel font rendering
         * for every node inside the exported element.
         */
        [data-export-root] {
          position: relative !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: geometricPrecision !important;
          font-synthesis: none !important;
        }

        [data-export-root] * {
          -webkit-font-smoothing: antialiased !important;
          text-rendering: geometricPrecision !important;
          font-family: inherit !important;
          line-height: inherit !important;
          letter-spacing: inherit !important;
        }

        /* ── Avatar (.player-avatar) ────────────────────────────────────── */
        /*
         * html2canvas can misplace inline text when line-height is inherited
         * as a unitless multiplier from a parent that itself has a non-standard
         * computed font-size.  Forcing the container to be a flex box and
         * setting line-height: 0 on the inner <span> (which already uses flex
         * itself) eliminates the vertical offset without changing the visible
         * font size or weight.
         *
         * – display:flex + align-items/justify-content: center  → the <span>
         *   child stays perfectly centred inside the 80×80 circle even if
         *   html2canvas recalculates the container's layout.
         * – line-height: 1 on the container prevents the browser from adding
         *   half-leading above/below the text node.
         * – The inner span gets line-height: 0 so that its own text node
         *   contributes zero extra height; centering is handled by flex alone.
         * – overflow:hidden makes sure nothing leaks outside the circle.
         */
        [data-export-root] .player-avatar {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          overflow: hidden !important;
        }

        [data-export-root] .player-avatar > span {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
          line-height: 0 !important;
        }

        /* ── Active/Archived badge (.player-status-badge) ───────────────── */
        /*
         * The badge renders correctly in the browser but html2canvas tends to
         * clip the text to the top half of the pill because it does not honour
         * the inherited line-height from Tailwind's base reset.
         *
         * Fix strategy:
         *  – Switch to display:flex (not inline-flex) so html2canvas gives it
         *    a proper block formatting context for the raster pass.
         *  – Use align-items:center + justify-content:center for both axes.
         *  – Fix the height at 28px (slightly taller than the live 24px h-6)
         *    so there is room for equal spacing above and below the text.
         *  – Add padding-bottom: 3px to compensate for sub-pixel descender
         *    space that html2canvas adds when computing font metrics; this
         *    nudges the optical centre back to the visual middle.
         *  – Set line-height: 1 to strip any inherited leading that would
         *    push the text away from the flex centre.
         *  – Force color:#000 (black) for export only — the green background
         *    has enough contrast with black to stay WCAG AA compliant.
         *  – border-radius:9999px preserves the rounded-pill shape at any
         *    computed width.
         */
        [data-export-root] .player-status-badge {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 28px !important;
          min-height: 28px !important;
          padding-top: 0 !important;
          padding-bottom: 3px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
          box-sizing: border-box !important;
          border-radius: 9999px !important;
          line-height: 1 !important;
          color: #000000 !important;
          background-color: #22c55e !important;
          font-weight: 600 !important;
          letter-spacing: normal !important;
          transform: none !important;
          vertical-align: middle !important;
        }

        /*
         * Any wrapper element the Badge component renders inside the pill
         * (e.g. a <span>) must also be flex-centred and have its own leading
         * stripped, otherwise it can re-introduce the vertical offset.
         */
        [data-export-root] .player-status-badge > * {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          padding: 0 !important;
          margin: 0 !important;
          transform: none !important;
        }
      `
      doc.head.appendChild(style)
    },
  })

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
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
