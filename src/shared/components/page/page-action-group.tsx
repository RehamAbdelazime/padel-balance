import type { ReactNode } from 'react'

interface PageActionGroupProps {
  children: ReactNode
  title?: string
}

export function PageActionGroup({ children, title }: PageActionGroupProps) {
  return (
    <div role="group" aria-label={title}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}
