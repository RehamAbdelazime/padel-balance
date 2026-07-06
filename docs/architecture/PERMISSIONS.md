# Permissions

Version: 1.0
Status: Accepted

## Purpose
Defines authorization rules for every role in PadelOps.

---

# Roles

## Owner
Full control over the Group.

## Admin
Operational management delegated by the Owner.

## Member
Player experience only.

---

# Permission Matrix

| Feature | Owner | Admin | Member |
|---------|:-----:|:-----:|:------:|
| View Dashboard | ✓ | ✓ | ✓ |
| Create Session | ✓ | ✓ | ✗ |
| Edit Session | ✓ | ✓ | ✗ |
| Delete Session | ✓ | ✓ | ✗ |
| Manage Players | ✓ | ✓ | ✗ |
| Generate Schedule | ✓ | ✓ | ✗ |
| Runtime Controls | ✓ | ✓ | ✗ |
| Record Scores | ✓ | ✓ | ✗ |
| View Reports | ✓ | ✓ | ✓* |
| Export Reports | ✓ | ✓ | ✗ |
| Invite Members | ✓ | ✓ | ✗ |
| Approve Join Requests | ✓ | ✓ | ✗ |
| Change Group Settings | ✓ | ✗ | ✗ |
| Transfer Ownership | ✓ | ✗ | ✗ |
| Delete Group | ✓ | ✗ | ✗ |

*Subject to future privacy settings.

---

# Ownership Rules

- Every Group has exactly one Owner.
- Ownership may be transferred.
- The previous Owner becomes Admin by default.

---

# Admin Rules

Admins may:
- Manage sessions
- Manage runtime
- Manage players
- Approve join requests

Admins may NOT:
- Delete groups
- Transfer ownership
- Change billing (future)

---

# Member Rules

Members may:
- View their sessions
- View their history
- View statistics
- Join future sessions (future)

Members may NOT modify operational data.

---

# Security Rules

- Authorization is enforced in the backend and database.
- UI visibility does not replace permission checks.
- Every request must verify both membership and role.

---

# Future Roles

Reserved:
- Referee
- Coach
- Spectator
- Tournament Manager

The permission model must remain backward compatible.
