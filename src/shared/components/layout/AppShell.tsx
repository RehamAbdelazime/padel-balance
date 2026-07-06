import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

/**
 * Application shell layout.
 *
 * Structure:
 *   [Sidebar] | [Header  ]
 *             | [<Outlet>]
 *
 * The Outlet renders the matched child route's page component.
 * Sidebar uses logical CSS (`border-e`) so RTL layout works without changes.
 * Toaster is mounted once here — hooks call toast.success/error() from anywhere.
 *
 * Print Mode (Sprint E1): Sidebar/Header/Toaster all carry `print:hidden`,
 * so `window.print()` from any page (see shared/export/print.ts) shows only
 * that page's own content — no per-page print CSS needed beyond a page
 * hiding its own buttons/dialogs the same way.
 */
export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header />
        </div>

        <main className="flex-1 overflow-auto p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>

      <div className="print:hidden">
        <Toaster position="top-right" richColors closeButton />
      </div>
    </div>
  )
}
