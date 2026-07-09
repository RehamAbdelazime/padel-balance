import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  actions?: ReactNode
}

export function EmptyState({ title, description, actions }: EmptyStateProps) {
  return (
    <div>
      <p>{title}</p>
      <p>{description}</p>
      {actions}
    </div>
  )
}
