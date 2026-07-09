import type { ReactNode } from 'react'

interface PageActionsProps {
  children: ReactNode
}

export function PageActions({ children }: PageActionsProps) {
  return <div role="group">{children}</div>
}
