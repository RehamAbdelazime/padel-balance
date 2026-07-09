export function DashboardScreen() {
  return (
    <section>
      <header>
        <h1>Dashboard</h1>
        <p>Overview of your group's activity.</p>
      </header>

      <section aria-labelledby="current-group-heading">
        <h2 id="current-group-heading">Current Group</h2>
        <p>The group you are currently viewing.</p>

        {/* TODO: Active group name */}

        {/* TODO: Switch group action */}
      </section>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading">Quick Actions</h2>
        <p>Shortcuts to common organiser tasks.</p>

        {/* TODO: Create Session action */}

        {/* TODO: Add Player action */}
      </section>

      <section aria-labelledby="todays-sessions-heading">
        <h2 id="todays-sessions-heading">Today's Sessions</h2>
        <p>Sessions scheduled for today.</p>

        {/* TODO: Today's sessions list */}

        {/* TODO: Empty state */}
      </section>

      <section aria-labelledby="recent-sessions-heading">
        <h2 id="recent-sessions-heading">Recent Sessions</h2>
        <p>The most recently completed sessions.</p>

        {/* TODO: Recent sessions list */}

        {/* TODO: Empty state */}
      </section>

      <section aria-labelledby="players-summary-heading">
        <h2 id="players-summary-heading">Players Summary</h2>
        <p>An overview of the group's players.</p>

        {/* TODO: Player counts */}

        {/* TODO: Recently active players */}
      </section>
    </section>
  )
}
