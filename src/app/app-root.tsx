import { useBootstrap } from '@/features/app-bootstrap/hooks/use-bootstrap'
import { AuthenticationFlow } from '@/features/auth/components/authentication-flow'

function AppSplash() {
  return <div>Loading...</div>
}

function AppError() {
  return <div>Something went wrong</div>
}

function NoGroupsScreen() {
  return <div>No Groups</div>
}

function GroupSelectionScreen() {
  return <div>Select Group</div>
}

function DashboardScreen() {
  return <div>Dashboard</div>
}

export function AppRoot() {
  const { state, isLoading, error } = useBootstrap()

  if (isLoading) {
    return <AppSplash />
  }

  if (error) {
    return <AppError />
  }

  switch (state?.state) {
    case 'UNAUTHENTICATED':
      return <AuthenticationFlow />
    case 'NO_GROUPS':
      return <NoGroupsScreen />
    case 'SELECT_GROUP':
      return <GroupSelectionScreen />
    case 'READY':
      return <DashboardScreen />
    default:
      return <AppSplash />
  }
}
