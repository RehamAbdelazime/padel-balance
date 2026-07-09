import type { ReactNode } from 'react'

interface ErrorStateProps {
  title?: string
  description?: string
  actions?: ReactNode
}

export function ErrorState({ title, description, actions }: ErrorStateProps) {
  return (
    <div role="alert">
      <p>{title ?? 'Something went wrong.'}</p>
      {description && <p>{description}</p>}
      {actions}
    </div>
  )
}
