interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div role="status">
      <p>{message ?? 'Loading...'}</p>
    </div>
  )
}
