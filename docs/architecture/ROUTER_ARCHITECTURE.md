# PadelOps Router Architecture Contract

This document defines the routing contract for PadelOps, complementing `UI_ARCHITECTURE.md` (§3 Application Layout, §4 Navigation). It is documentation only — no React Router code is prescribed or implied to exist yet beyond what is noted as already present.

---

# 1. Goals

**What routing should own:**
- Mapping a URL to a top-level page component.
- Route params (`:playerId`, `:sessionId`) as the single source of truth for "which entity is this detail page showing."
- Nesting: which pages render inside `AppShell` vs. outside it (§3).
- Lazy-loading boundaries (§6).
- The 404 / route-not-found case (§7).

**What routing should never own:**
- **Auth/group state.** Whether the user is authenticated, has a profile, or belongs to a group is `BootstrapService`/`AppRoot`'s responsibility (`UI_ARCHITECTURE.md` §2, §4), not the router's. The router does not gate `/dashboard` behind an auth check — `AppRoot` simply never renders the router's tree until bootstrap resolves to `READY` (see §4 below for how this reconciles with the routes that *do* exist today).
- **Business logic.** A route element is a thin page component that calls hooks; it never contains service calls or Supabase access directly.
- **Current group selection.** The router does not read or write `CurrentGroupStore`. A route can *require* a current group to exist (§4), but deciding *which* group is current is `AppRoot`'s and `GroupSelectionScreen`'s job.
- **Toast/dialog/overlay state.** Global overlays (`UI_ARCHITECTURE.md` §9) are rendered by `AppShell`, not spawned or dismissed by route transitions.

---

# 2. Route Tree

```
/
├── login                      (public — Authentication Layout)
├── groups
│   ├── select                 (group-required-to-resolve, but no current group yet — GroupSelection Layout)
│   └── join                   (post-auth, no group yet — NoGroups Layout)
├── dashboard                  (AppShell — index route)
├── players                    (AppShell)
│   ├── new                    (AppShell — dialog-based today, reserved as a route for future deep-linking)
│   └── :playerId               (AppShell)
├── sessions                   (AppShell)
│   ├── new                    (AppShell — dialog-based today, reserved as a route for future deep-linking)
│   ├── :sessionId               (AppShell)
│   └── :sessionId/report        (AppShell)
├── profile                    (AppShell)
└── settings                   (AppShell)
```

**Current implementation state** (`src/app/router/index.tsx`): only the `AppShell`-nested branch exists today — `/` (Dashboard, index route), `/players`, `/players/:playerId`, `/sessions`, `/sessions/:sessionId`, `/sessions/:sessionId/report`. `login`, `groups/select`, `groups/join`, `profile`, and `settings` are not yet registered as routes — `AuthenticationFlow`, `NoGroupsFlow`, and `GroupSelectionScreen` are today rendered directly by `AppRoot` as full-screen replacements, not as router entries (see §4). `players/new` and `sessions/new` are dialog-driven (`PlayerFormDialog`, `SessionFormDialog`) rather than routes; they're listed here as reserved paths for if/when deep-linking to "create" flows becomes a requirement, not as current behavior.

---

# 3. Route Layouts

| Layout | Routes | Owns |
|---|---|---|
| **AppShell** (`src/app/layout/app-shell.tsx`) | `dashboard`, `players`, `players/:playerId`, `sessions`, `sessions/:sessionId`, `sessions/:sessionId/report`, `profile`, `settings` | Header/Sidebar/Content/Global Overlays frame (`UI_ARCHITECTURE.md` §3). Rendered only once `AppRoot` has resolved to `READY`. |
| **Authentication Layout** | `login` (and its internal OTP sub-state) | No Header/Sidebar — a minimal centered layout for `LoginScreen`/`VerifyOtpScreen`. Not a router layout today; `AuthenticationFlow` is rendered directly by `AppRoot` for the `UNAUTHENTICATED` bootstrap state, with no shared visual chrome of its own yet. |
| **NoGroups Layout** | `groups/join` (and the Create Group sub-flow) | Same minimal-chrome treatment as Authentication Layout — no group exists yet, so no TopBar "active group" indicator is possible. Rendered directly by `AppRoot` for `NO_GROUPS` today, same caveat as above. |
| **GroupSelection Layout** | `groups/select` | Minimal chrome, list-focused. Rendered directly by `AppRoot` for `SELECT_GROUP` today. |

Reconciliation note: `src/shared/components/layout/AppShell.tsx` (Header/Sidebar/MobileBottomNav) is the layout the *current* router (`src/app/router/index.tsx`) actually nests routes under today. `src/app/layout/app-shell.tsx` (created in Sprint UI-2) is the new skeleton intended to replace it per `UI_ARCHITECTURE.md` §3. These are two distinct components as of this document; migrating the router from the old to the new is future work (§8), not yet done, and must not be treated as already complete.

---

# 4. Route Protection

- **Public routes:** `login`. Reachable with no session at all.
- **Authenticated routes:** `groups/join`, `groups/select`. Require a resolved profile (`BootstrapService` past the `PROFILE` step) but explicitly *no* current group yet — these are the routes a user sees precisely because they don't have one.
- **Group-required routes:** every `AppShell`-nested route (`dashboard`, `players`, `sessions`, `profile`, `settings`, and all their children). These require `currentGroupId` to be non-null (`UI_ARCHITECTURE.md` §5); a hook reading a group-scoped service on one of these routes will reject with `"No current group selected"` if this invariant is ever violated.
- **Future owner-only routes:** reserved for Admin (§8) — group-owner/admin-role-gated pages (member management, ownership transfer). Not implemented; when added, the *route* will still not own the permission check — the page will call a hook that surfaces a permission error the same way any other error is surfaced (`UI_ARCHITECTURE.md` §13), consistent with "routing never owns business logic" (§1).

**How protection is actually enforced today:** not via router guards. `AppRoot` (`UI_ARCHITECTURE.md` §2, §4) is the sole gate — it renders one of `AuthenticationFlow` / `NoGroupsFlow` / `GroupSelectionScreen` / the routed `AppShell` tree based on `BootstrapService`'s state, and the React Router tree (§2) is only ever mounted for the last case. There is no `<ProtectedRoute>` wrapper component and none should be added — see Decision Log (§9).

---

# 5. Navigation Rules

- **Never navigate from services.** A service returns data or throws; it has no knowledge that a router exists (`UI_ARCHITECTURE.md` §4, restated here as it is a routing-contract rule as much as a UI one).
- **Never navigate from hooks.** A hook's job ends at exposing data/mutation state. If a mutation's success should cause a navigation, the *page* passes a navigation callback into the mutation's `onSuccess`, not the hook itself.
- **Pages own navigation.** Only route-level page components (and the top-level flow components — `AuthenticationFlow`, `NoGroupsFlow`) call `useNavigate()`/render a `<Navigate>`. A reusable component nested several levels deep should not need to know about routes at all — if it does, that's a sign it should have been a page.
- **Dialogs return results only.** A dialog (create/edit/confirm) calls its `onSuccess`/`onClose` prop when done; it never navigates itself. The page that opened the dialog decides whether success should also navigate somewhere (e.g. creating a session and then navigating to its detail page is the page's decision, not `SessionFormDialog`'s).

---

# 6. Lazy Loading Strategy

**Lazy loaded today** (`src/app/router/index.tsx`, Sprint RC1): every content page — `DashboardPage`, `PlayersPage`, `PlayerProfilePage`, `SessionsPage`, `SessionDetailPage`, `SessionReportPage`. Each is a separate `lazy(() => import(...))` chunk, so a user opening `/players` first never downloads the Sessions/Dashboard bundles.

**Eagerly loaded:** the shell itself (`AppShell` — old or new), the router table, `App.tsx`, and anything `AppRoot` needs before routing even begins (`AuthenticationFlow`, `NoGroupsFlow`, `GroupSelectionScreen`, and their sub-components) — these render *before* the router's Suspense boundary exists, so lazy-loading them would need its own top-level Suspense handling, which is deferred (§8) rather than assumed solved.

**Going forward:** any new top-level route follows the same pattern — a `lazy()` import in the route table, never a static import of a full page component. Sub-components used *within* an already-lazy page (dialogs, cards, tables) do not need their own `lazy()` boundary; the page-level split is the granularity that matters.

---

# 7. Error Handling

- **404 page:** not implemented yet. When added, it is a route-tree-level `errorElement`/catch-all path (`*`), rendered inside `AppShell` for authenticated group-scoped 404s (e.g. `/players/does-not-exist`) — not a full-page takeover, so the Sidebar/TopBar remain usable to navigate away.
- **Unexpected errors:** caught by a route-level Error Boundary (`UI_ARCHITECTURE.md` §13), not scattered `try/catch` in components. Not implemented yet — reserved for the first sprint that wires real routing/layout end-to-end (§8).
- **Error Boundaries:** one per top-level route branch (the `AppShell`-nested tree, and eventually each pre-bootstrap flow), so an error in one page doesn't blank the entire app — the Sidebar/TopBar chrome should ideally survive a Content-area crash. This granularity is a target, not yet implemented.

---

# 8. Future Expansion

- **Admin** — owner/admin-role-gated routes (§4 future owner-only routes) for member management, role changes, ownership transfer, group settings.
- **Statistics** — cross-session/cross-player analytics routes, likely nested under a new top-level `statistics` branch, `AppShell`-nested like every other group-required route.
- **Public links** — read-only, unauthenticated share links (e.g. a public session summary) — these would need their own layout distinct from all four in §3, since they have neither auth nor group context and must not accidentally expose group-scoped data beyond what's explicitly shared.
- **Invitation links** — a `groups/join?code=XXXX` deep link that pre-fills `JoinGroupScreen`'s invite-code field — requires the router to accept a query param on an otherwise-unauthenticated-reachable route, and for `AppRoot` to preserve that param across the authentication flow if the invited user isn't logged in yet. Not implemented; the invite-code join flow itself (`MembershipService.joinByGroupCode`) already exists and this would only be a routing/UX layer on top of it.
- **Migrating old → new AppShell** — replacing `src/shared/components/layout/AppShell.tsx` with `src/app/layout/app-shell.tsx` in the router table (§3 reconciliation note) is a prerequisite for most of the above, since new routes should be added to the architecture this document describes, not the one being phased out.

---

# 9. Decision Log

- **`AppRoot` gates, the router doesn't.** Bootstrap state (`UI_ARCHITECTURE.md` §2) determines whether the router's tree is mounted at all, rather than wrapping every route in a `<ProtectedRoute>` element. A guard-component approach would duplicate the same four-state switch `AppRoot` already owns, in a second place, for no added capability — violating the same "single source of truth" reasoning already applied to `CurrentGroupStore` (`UI_ARCHITECTURE.md` §16).
- **Detail routes are siblings, not nested resource routes.** `/sessions/:sessionId` is a sibling of `/sessions`, not `/sessions/:sessionId` nested under a shared `sessions` layout route with its own `<Outlet>` — because each session/player detail page renders its own full page layout today (per the existing router comment), and introducing a shared list+detail layout would be a larger restructuring than this contract currently requires. Revisit only if a genuine shared-chrome need appears (e.g. a persistent list sidebar next to the detail view).
- **`new` (create) is a dialog, not a route, for now.** Both `PlayerFormDialog` and `SessionFormDialog` are opened from within the list page rather than at a dedicated `/players/new` URL, because there is no current requirement to deep-link directly into a create flow, and a dialog is one interaction cheaper than a route change for the common case. The paths are reserved in the route tree (§2) precisely so this can change without a naming decision later.
- **Lazy-loading is per top-level page, not per-component.** Chosen in Sprint RC1 specifically to stop every page's bundle shipping regardless of the user's first destination; finer-grained splitting (per-dialog, per-card) was rejected as premature — it adds Suspense-boundary complexity without a measured bundle-size problem to justify it (`UI_ARCHITECTURE.md`'s "no speculative abstraction" principle, §1, applies here too).
- **Two `AppShell`s currently coexist, and that's tracked, not hidden.** Rather than silently treating the new `src/app/layout/app-shell.tsx` skeleton as if it were already wired in, this document records the two as distinct so a future sprint migrating the router won't be surprised by which one is actually live.

---

*This document complements `UI_ARCHITECTURE.md` and does not restate its content beyond the minimum needed for routing-specific context. Where the two disagree, treat it as a signal to reconcile both documents in the same sprint, not to pick one silently.*
