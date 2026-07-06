/**
 * The interface any page implements to plug into the shared Export &
 * Sharing module (Sprint E1). This is the only contract a future page
 * needs to satisfy — no export logic lives in the page itself.
 */
export interface ExportSource {
  /**
   * Returns the DOM node to rasterize for PDF/Image export. Must contain no
   * interactive UI (buttons, dialogs, nav) — the same discipline
   * SchedulePrintout already established: a dedicated, clean node, never
   * the live interactive page.
   */
  getNode: () => HTMLElement | null
  /** Base filename, no extension (e.g. "friday-americano-report"). */
  filename: string
  /** Plain-text summary for Copy Summary and any future text-based channel. */
  getSummaryText: () => string
}

export type ExportAction = 'pdf' | 'image' | 'print' | 'copy'
