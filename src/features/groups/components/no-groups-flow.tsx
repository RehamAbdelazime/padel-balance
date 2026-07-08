import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { useBootstrap } from '@/features/app-bootstrap/hooks/use-bootstrap'
import { CreateGroupScreen } from './create-group-screen'

type NoGroupsFlowState = 'HOME' | 'CREATE'

export function NoGroupsFlow() {
  const { reload } = useBootstrap()
  const [screen, setScreen] = useState<NoGroupsFlowState>('HOME')

  const onCreateGroup = () => setScreen('CREATE')

  // TODO: connect to group join flow in the next sprint.
  const onJoinGroup = () => {}

  const handleCreateCompleted = async () => {
    await reload()
  }

  if (screen === 'CREATE') {
    return <CreateGroupScreen onCompleted={handleCreateCompleted} />
  }

  return (
    <div className="space-y-4">
      <h1>Welcome to PadelOps</h1>
      <p>Create a new group or join an existing one.</p>

      <Button type="button" onClick={onCreateGroup}>
        Create Group
      </Button>
      <Button type="button" variant="outline" onClick={onJoinGroup}>
        Join Group
      </Button>
    </div>
  )
}
