/**
 * Shared Export & Sharing module (Sprint E1) — the single place PDF/Image/
 * Print/Copy-summary logic lives. Any page exports by implementing
 * `ExportSource` and rendering `<ShareReportButton source={...} />`; no
 * page implements its own export logic.
 */
export type { ExportSource, ExportAction } from './types'
export { ShareReportButton } from './components/ShareReportButton'

// Individual primitives — exported for direct reuse (e.g. schedule-export.ts
// delegates to these instead of duplicating canvas/PDF logic).
export { renderNodeToCanvas, canvasToBlob, downloadBlob } from './canvas'
export { exportNodeToPdf } from './pdf'
export { exportNodeToImage } from './image'
export { printCurrentPage } from './print'
export { copyTextToClipboard } from './clipboard'
export { friendlyExportErrorMessage } from './errors'
