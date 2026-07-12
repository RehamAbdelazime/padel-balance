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

/**
 * Print only the dedicated report/export node, not the whole application page.
 * This avoids duplicate pages caused by printing the live page shell together
 * with the off-screen export container used for PDF/Image export.
 */
export function printNode(node: HTMLElement): void {
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) {
    throw new Error('Unable to open print window.')
  }

  const doc = win.document
  doc.open()
  doc.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Print report</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
          }
          * {
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>${node.outerHTML}</body>
    </html>`)
  doc.close()

  win.focus()
  const onAfterPrint = () => {
    win.removeEventListener('afterprint', onAfterPrint)
    win.close()
  }

  win.addEventListener('afterprint', onAfterPrint)
  win.print()
}
