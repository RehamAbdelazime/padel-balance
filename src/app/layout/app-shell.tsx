import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div>
      <header>
        {/* TODO: App Logo */}

        {/* TODO: Active Group */}

        {/* TODO: Notifications */}

        {/* TODO: Profile Menu */}
      </header>

      <main>
        {children}
      </main>

      <footer>
        {/* TODO: Bottom Navigation */}
      </footer>
    </div>
  )
}
