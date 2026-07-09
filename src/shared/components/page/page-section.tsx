import type { ReactNode } from 'react'

interface PageSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function PageSection({ title, description, children }: PageSectionProps) {
  return (
    <section>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  )
}
