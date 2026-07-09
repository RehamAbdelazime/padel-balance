# PadelOps UI Architecture Contract

This document is the long-term reference for all frontend work on PadelOps. It defines how screens, layouts, state, and navigation fit together. Sprint-level implementation must follow this contract; deviations require an explicit sprint note, not a silent departure.

---

# 1. Design Principles

- **Desktop-first.** The organiser runs live sessions from a laptop or tablet courtside. Layouts are designed for desktop first, then adapted down.
- **Responsive down to tablet.** Every screen must remain usable at tablet widths. Phone-width layouts are not a current requirement.
- **Mobile later.** A dedicated mobile experience is an explicit future initiative (see §15), not an incidental side effect of "responsive" work today.
- **Feature-based architecture.** UI code lives inside its owning feature folder (`src/features/<feature>/components`), never in a shared catch-all folder, matching the existing `sessions`/`players`/`groups`/`auth` structure.
- **Reusable components** live in `src/shared/components` only once a second feature needs them — never extracted speculatively ahead of a real second use.
- **Business logic never lives in UI.** Components render; hooks orchestrate loading/error state and call services; services hold all business logic and Supabase access. This mirrors the rule already enforced for the Session feature and applies to every feature equally.

---

# 2. Application State Flow

```
UNAUTHENTICATED → OTP → PROFILE → NO_GROUPS → GROUP_SELECTION → DASHBOARD
```

This is the conceptual flow. It is implemented today by `BootstrapService.bootstrap()` (`src/features/app-bootstrap/services/bootstrap.service.ts`) and consumed by `AppRoot` (`src/app/app-root.tsx`), whose actual state names are `UNAUTHENTICATED`, `NO_GROUPS`, `SELECT_GROUP`, and `READY` — `OTP`/`PROFILE` are sub-states of the authentication flow (owned by `AuthenticationFlow`, not `BootstrapService`), and `GROUP_SELECTION`/`DASHBOARD` map to `SELECT_GROUP`/`READY` respectively. Future work should keep this document's conceptual names and the code's literal state names in sync — if one is renamed, update the other.

**UNAUTHENTICATED → OTP** — `AuthenticationFlow` renders `LoginScreen`, which collects a phone number and calls `AuthService.requestOtp`. On success it transitions its own local state to `VERIFY_OTP` (not a `BootstrapService` state) and renders `VerifyOtpScreen`.

**OTP → PROFILE** — `VerifyOtpScreen` calls `AuthService.verifyOtp`. On success it calls `useBootstrap().reload()`, which re-runs `BootstrapService.bootstrap()`. The service then loads the profile via `ProfileService.getCurrentProfile()`; a missing profile throws (profile creation is assumed to happen at signup, not lazily here — this is a documented constraint, not yet a dedicated onboarding step).

**PROFILE → NO_GROUPS** — Once a profile is confirmed, `BootstrapService` loads active memberships via `MembershipService.list()`. Zero memberships yields `NO_GROUPS`, and `AppRoot` renders `NoGroupsFlow`, which offers Create Group / Join Group.

**NO_GROUPS → GROUP_SELECTION** — This transition only fires for a user who already has more than one active membership at bootstrap time (not as a direct result of creating/joining their first group, which instead goes straight to `READY` via `AppRoot`'s bootstrap-effect, see §5). `GROUP_SELECTION` (`SELECT_GROUP`) is rendered by `GroupSelectionScreen` when `memberships.length > 1`.

**GROUP_SELECTION → DASHBOARD** — Selecting a group sets `currentGroupId` via `CurrentGroupStore.setCurrentGroup()` (see §5), after which the screen the user lands on is `DashboardScreen`. `READY` (`memberships.length === 1`) skips this step entirely — `AppRoot`'s bootstrap-effect sets `currentGroupId` automatically.

---

# 3. Application Layout

```
App
  Router
    AppShell
      TopBar
      Sidebar
      Content
      Global Overlays
```

- **App** (`src/app/App.tsx`) — the true root. Owns the `QueryClientProvider` (single, module-scoped `QueryClient`) and the `RouterProvider`. Nothing else.
- **Router** (`src/app/router`) — route table. Decides which top-level page component renders for a given URL; does not itself decide auth/group state (that's `AppRoot`/`BootstrapService`'s job, see §2 and §4).
- **AppShell** (`src/app/layout/app-shell.tsx`) — the persistent visual frame every authenticated, in-group screen renders inside. Owns `header`/`main`/`footer` structure only; no state, no data fetching, no navigation logic of its own.
  - **TopBar** — app logo, active group indicator, notifications, profile menu. Reads `currentGroupId`/profile data via hooks; never fetches directly.
  - **Sidebar** — primary navigation between top-level routes (§4). Highlights the active route; does not own routing state itself, only reflects it.
  - **Content** — the routed page (`children` passed into `AppShell`). This is where CRUD pages (§7) and Detail pages (§8) live.
  - **Global Overlays** — Toast Host, Confirm Dialog, Loading Overlay (§9) — rendered once at the shell level, not re-instantiated per page.

`AppShell` itself is intentionally dumb (per its UI-2 skeleton): layout structure only, no imported hooks or services. State and data flow into it exclusively through props and through the global overlay components it hosts.

---

# 4. Navigation

**Top-level routes** (Sidebar-visible, require `READY` bootstrap state): Dashboard, Players, Sessions, Profile, Settings.

**Protected routes** — everything behind `AppRoot`'s `READY` state. A route is "protected" simply by living inside the tree `AppRoot` renders for `READY`; there is no separate route-guard component to maintain in parallel.

**Public routes** — anything reachable before `READY`: the authentication flow (`UNAUTHENTICATED`/`OTP`), `NoGroupsFlow`, `GroupSelectionScreen`. These render outside `AppShell` (no TopBar/Sidebar) since there is no "current group" context yet for most of them.

**Future admin routes** — reserved for group-owner-only screens (member management, role changes, group settings beyond the current user's own profile). Not implemented; see §15.

**Future statistics routes** — reserved for cross-session player/group analytics beyond the existing per-player statistics feature. Not implemented; see §15.

**Navigation rules:**
- **Never navigate from services.** Services return data or throw; they never call `navigate()` or know that a router exists.
- **Never navigate from hooks.** Hooks manage query/mutation state; navigation decisions belong to the component consuming the hook (e.g., a dialog's `onSuccess` callback closes itself and the *page* decides whether to navigate, not the hook).
- Navigation is a UI-layer concern exclusively — components and the router, nothing beneath them.

---

# 5. Current Group

- **Source of truth:** `CurrentGroupStore` (`src/app/store/current-group.store.ts`) — a plain Zustand store holding `currentGroupId: string | null`. No persistence, no middleware, no derived logic.
- **Owner:** `AppRoot`. It is the only component that calls `setCurrentGroup`/`clearCurrentGroup` automatically, via a `useEffect` reacting to `BootstrapService`'s state. No other component or hook should call these setters implicitly as a side effect of unrelated work — only explicit user actions (e.g. a future "switch group" action from `GroupSelectionScreen` or the TopBar) should call `setCurrentGroup` directly.
- **When it changes:**
  - Set automatically to the single membership's `group_id` when bootstrap resolves to `READY`.
  - Cleared automatically on `UNAUTHENTICATED` or `NO_GROUPS`.
  - Left untouched (`null`) on `SELECT_GROUP` — the user must explicitly choose, which is `GroupSelectionScreen`'s job (not yet wired to call `setCurrentGroup`, see §15).
- **Which screens require it:** every screen inside `AppShell` — Dashboard, Players, Sessions, Profile (group-scoped fields), Settings, and every session/schedule/match/runtime hook (all group-scoped services from the multi-group retrofit require it and reject with `"No current group selected"` if it's null).
- **Which screens do not:** `AuthenticationFlow` (Login/VerifyOtp), `NoGroupsFlow`/`CreateGroupScreen`, and `GroupSelectionScreen` itself — these all run before a current group exists by definition.

---

# 6. Page Contract

Every page component must account for exactly these states, in this priority order:

1. **Loading** — while any required query is in-flight and no cached data exists yet.
2. **Error** — a query/mutation failed in a way the user must be told about (not a validation error — see §13).
3. **Empty** — the query succeeded but returned nothing meaningful to show (e.g. no players, no sessions).
4. **Content** — the real page body once data exists.
5. **Optional FAB** — a floating primary action, only where a CRUD page's primary action doesn't fit naturally in the header (§7).
6. **Optional Dialogs** — create/edit/confirm dialogs owned by the page, mounted conditionally, never always-mounted-but-hidden.

A page that skips a state it actually needs (e.g. no Empty state on a list that can legitimately be empty) is incomplete, not "simplified."

---

# 7. CRUD Page Standard

Every list/management page (Players, Sessions, future Admin screens) follows:

```
Header
Search
Filters
Primary Action
Table / List
Pagination
Empty State
```

- **Header** — page title + short description (matches the UI-1 screen skeletons already in place).
- **Search** — free-text filter, client-side unless the dataset requires server-side search.
- **Filters** — structured filters (status, date range, etc.) where the domain calls for them; omitted entirely if the entity has nothing to filter by.
- **Primary Action** — the one dominant "Create X" action; a single button, not competing with secondary actions.
- **Table/List** — the actual rows; row-level actions (edit/archive) live here, not in a separate toolbar.
- **Pagination** — required once a list can realistically exceed one screen; a small, single-organiser dataset (e.g. a group's own players) may reasonably defer this.
- **Empty State** — see §6; must guide the user to the Primary Action, not just say "nothing here."

---

# 8. Detail Page Standard

Every single-entity page (a session's detail workspace, a player's profile) follows:

```
Header
Actions
Tabs
History
Danger Zone
```

- **Header** — entity name/summary + status badge where applicable (e.g. `SessionDetailPage`'s status badge, §Page Contract already implemented there).
- **Actions** — the entity-level mutations available (edit, archive, postpone, etc.), grouped near the header, not scattered through the page.
- **Tabs** — where an entity has more than one meaningfully distinct view (e.g. Schedule vs. Attendance vs. Matches for a session) — omitted for entities simple enough not to need them.
- **History** — an append-only or read-only record relevant to the entity (match history, runtime audit log) — rendered, not editable, from this page.
- **Danger Zone** — destructive/irreversible actions (archive, in the future: delete once policy allows it) — visually and spatially separated from routine actions, always behind a Confirm Dialog (§9, §14).

---

# 9. Global Components

Rendered once, at the `AppShell` level (§3), never re-instantiated per page:

- **TopBar** — see §3.
- **Sidebar** — see §3.
- **Breadcrumb** — contextual path for nested detail pages (e.g. Sessions → Session Detail). Optional on pages one level deep (top-level CRUD pages don't need it).
- **Dialogs** — page-owned create/edit/confirm dialogs mount conditionally (§6); the *dialog components themselves* are shared UI (`src/shared/components/ui/dialog.tsx`) but their content and open/close state belong to the page that uses them, not to `AppShell`.
- **Toast Host** — single instance (already `sonner`-based across existing services/hooks); every mutation's success/error feedback flows through it.
- **Loading Overlay** — full-screen loading state for app-level transitions (e.g. `AppSplash` during bootstrap); distinct from a page's own inline Loading state (§6), which is scoped to that page's content area only.
- **Confirm Dialog** — the single shared component for any destructive action confirmation (§8 Danger Zone, §14) — never a bespoke `window.confirm` or a one-off inline dialog.

---

# 10. Feature Structure

Every feature folder follows the same shape (already established by `sessions`, `players`, `auth`, `groups`, `membership`, `profile`):

```
src/features/<feature>/
  components/   — UI, thin renderers only
  hooks/        — thin wrappers: call services, manage loading/error/query state
  services/     — all business logic + Supabase access, zero React
  schemas/      — Zod schemas + inferred types (where the feature has form input to validate)
  types/        — domain types (often derived from generated Supabase `Tables`/`TablesUpdate` helpers)
```

Not every feature needs every folder (e.g. `app-bootstrap` has no `schemas`, `groups` has no `types` folder today) — create a folder only when the feature actually has content for it.

---

# 11. State Ownership

Three tiers, never overlapping:

- **React Query (TanStack Query)** — all server state: anything that came from or is going to Supabase. Every feature's `hooks/use-*.ts` file owns its query keys and invalidation. This is the *only* place server data is cached.
- **Zustand** — minimal, cross-cutting client state that must survive across route changes and be readable outside any single component tree: today, `CurrentGroupStore` (§5) and `useAppStore` (sidebar-collapsed UI preference). Not for anything React Query already owns.
- **Component State (`useState`)** — local, ephemeral UI state scoped to one component/page: form draft values (owned by React Hook Form, see §12), dialog open/closed flags, in-progress local edits before a mutation commits (e.g. `useSchedule`'s `isLoading`/`error`/`recovery` state, which wraps but does not duplicate the server state it eventually persists).

**Never duplicate state.** If a value can be derived from a React Query cache entry, it must not also be copied into a `useState` or a Zustand field "for convenience." The one exception already in the codebase — `useSchedule` holding its own `schedule` state rather than a query — is deliberate: the schedule is mutated optimistically and persisted in the background (§ existing `schedule.service.ts`/`schedule-persistence.service.ts` docs), not a case of accidental duplication.

---

# 12. Forms

- **React Hook Form** is the only form library. Every form uses `useForm` with `zodResolver`.
- **Zod** schemas are the single source of truth for validation rules and inferred TypeScript types (`z.infer<typeof Schema>`) — never a hand-written interface duplicating what a schema already describes (see the Auth feature's `OtpRequestSchema`/`OtpVerificationSchema` retrofit history for why this was made an explicit rule after an early duplication).
- **Mutation Pattern:** a form's `onSubmit` calls a single `useMutation` (or, for simple flows, direct async/await with local `isSubmitting`/`submitError` state, as in `LoginScreen`/`VerifyOtpScreen`/`CreateGroupScreen`). On success: close the dialog / transition the flow. On failure: surface the error inline (§13) — never silently swallow it.

---

# 13. Error Strategy

Three distinct channels, chosen by error origin, never mixed:

- **Validation → Inline.** Zod/React Hook Form field errors render under the field via `FormMessage` (§12). Never a toast for a validation error the user can see and fix immediately.
- **Network → Toast.** A failed mutation (Supabase error, thrown service error) surfaces via the Toast Host (§9) — the existing `friendly*ErrorMessage` helpers (e.g. `friendlyPlayerErrorMessage`, `friendlyAttendanceErrorMessage`) translate raw error messages into user-facing text before they reach the toast.
- **Unexpected → Error Boundary.** A genuinely unexpected render-time exception (not a handled service error) is caught by a route-level Error Boundary, not by ad-hoc `try/catch` scattered through components. (Not yet implemented — see §15.)

---

# 14. UI Principles for PadelOps

- **Large click targets.** The organiser is often standing courtside with a phone/tablet, not seated at a desk — buttons and row actions must be comfortably tappable, not dense desktop-software-style controls.
- **Fast live-session workflow.** Once a session is `LIVE`, every runtime action (Start Match, Finish Match, Rest/Return/Leave/Replace) must be reachable in the fewest possible interactions — this is the highest-frequency, highest-stakes workflow in the product.
- **Minimal clicks.** Prefer inline actions and single-dialog flows over multi-step wizards, except where a wizard genuinely reduces error (e.g. `SchedulePlanningWizard`, which exists because format/settings selection is inherently multi-step).
- **Critical actions always visible.** The organiser should never have to hunt through a menu to find Start Match, Finish Match, or the current live schedule state — these live in the primary content area, not behind a secondary disclosure.
- **Dangerous actions require confirmation.** Every irreversible or hard-to-reverse action (archive, cancel match, leave-as-last-owner) goes through the shared Confirm Dialog (§9) — never a single unconfirmed click.
- **Desktop keyboard shortcuts.** Reserved for future work once the desktop-first live-session screen is built out (see §15) — e.g. quick score entry without leaving the keyboard.

---

# 15. Future Roadmap

- **Dashboard** — flesh out `DashboardScreen`'s TODOs (Today Summary, Upcoming/Recent Sessions, Players Overview, Quick Actions) using the existing `useScheduleSummary`/`usePlayers`/`useSessions` read hooks.
- **Players** — flesh out `PlayersScreen` (Search, List, Create) on top of the already-group-aware `usePlayers.ts`.
- **Sessions** — flesh out `SessionsScreen`, then wire `SessionDetailPage` into the new `AppShell`/routing structure.
- **Runtime** — surface the Live Runtime workflow (§14) as first-class UI once Sessions is wired: Start/Finish/Cancel Match, Rest/Return/Leave/Replace, Recovery/Undo — all backing services already exist and are group-aware (Runtime Aggregate retrofit, R1–R3).
- **Statistics** — cross-session/cross-player analytics beyond the existing per-player history tables (§4 future statistics routes).
- **Admin** — group-owner tooling: member role changes, removal, ownership transfer (explicitly deferred by the Membership sprint, U4.1), group settings beyond the creator's own profile.

---

# 16. Decision Log

- **Bootstrap-driven top-level routing, not a route guard component.** `AppRoot` switches on `BootstrapService`'s state directly (§2, §4) rather than wrapping routes in a `<ProtectedRoute>` component, because the four states (`UNAUTHENTICATED`/`NO_GROUPS`/`SELECT_GROUP`/`READY`) are mutually exclusive top-level screens, not a binary "allowed/not allowed" gate — a route-guard abstraction would add a layer without adding capability.
- **`CurrentGroupStore` is deliberately "dumb."** It holds only `currentGroupId` and two setters, with zero business logic, because every consumer (§5) already gets its group-scoped data through React Query hooks that read the store — putting logic in the store itself would create a second place group-membership rules could live, violating "single source of truth."
- **Services never see Zustand or React.** Every group-aware service retrofit (Players → Attendance → Sessions → Matches → Runtime, sprints P1–R3) threaded `groupId` through as an explicit function parameter rather than having services read `CurrentGroupStore` directly, so services remain pure, testable without React, and reusable from any future consumer (CLI script, background job, etc.).
- **Zod schemas, not hand-written interfaces, are the DTO source of truth.** The Auth feature briefly had both (`OtpRequest`/`OtpVerification` interfaces alongside inferred Zod types) before an explicit cleanup sprint (B2.1A) deleted the interfaces — this document codifies that as the permanent rule (§12), not a one-off fix.
- **Fire-and-forget background persistence for schedule mutations.** Every sync schedule/runtime mutation (`schedule.service.ts`, `match-runtime.service.ts`, `player-runtime.service.ts`) applies in memory immediately and persists via a non-blocking background save, because the live-session workflow (§14) cannot afford to block the UI on a network round-trip for every score entry or player-status change — errors are logged, not surfaced as a blocking failure, since the in-memory state is already correct and the next mutation's save will retry.
- **`npm run build` (`tsc -b && vite build`), not a bare `tsc --noEmit`, is the authoritative verification command.** This project uses TypeScript project references (`tsconfig.json` has `"files": []`), so a bare `tsc --noEmit` silently checks nothing — this was discovered mid-retrofit (Sprint P2) after several earlier sprints had falsely reported a clean typecheck. Documented here so it is never re-discovered the hard way.

---

*This document supersedes ad-hoc UI conventions established sprint-by-sprint. Where existing code (e.g. `SessionDetailPage`) predates a rule stated here and conflicts with it, treat the conflict as known technical debt to reconcile in a future sprint, not as evidence the rule is wrong.*
