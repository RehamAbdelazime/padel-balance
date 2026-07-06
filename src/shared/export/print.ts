/**
 * Print Mode (Sprint E1 Step 4) is CSS-driven, not canvas-driven: the app
 * shell (Sidebar/Header/Toaster) and every page's own buttons/dialogs carry
 * `print:hidden`, so a native browser print already shows only the report
 * content — see AppShell.tsx and each ExportSource page. No library is
 * needed here; `window.print()` is a standard browser API.
 */
export function printCurrentPage(): void {
  window.print()
}
