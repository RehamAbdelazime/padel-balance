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
 */
export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
