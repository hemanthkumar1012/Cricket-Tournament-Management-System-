# CricPulse QA checklist

A living acceptance checklist for the tournament operations dashboard.

## Dashboard

- [ ] QA-001: Dashboard renders the tournament summary without blocking on a single failed data source.

- [ ] QA-002: Dashboard shows a clear loading state while tournament metrics are being requested.
- [ ] QA-003: Dashboard surfaces a recoverable error when the summary request fails.
- [ ] QA-004: Dashboard shows an intentional empty state when no teams exist.
- [ ] QA-005: Dashboard shows an intentional empty state when no fixtures exist.
- [ ] QA-006: KPI cards use consistent labels, values, and supporting context.
- [ ] QA-007: Completion percentage remains readable at narrow mobile widths.
- [ ] QA-008: Recent matches are ordered consistently for the tournament operator.
- [ ] QA-009: Leaderboard summary highlights the current points leader without hiding other teams.
- [ ] QA-010: Operations cards remain readable when action descriptions wrap to multiple lines.
- [ ] QA-011: Dashboard navigation actions move to the intended workspace.
- [ ] QA-012: Refresh actions do not duplicate dashboard records.
- [ ] QA-013: Dashboard remains usable when one secondary panel has no data.
- [ ] QA-014: Dashboard metrics do not display undefined or null values.
- [ ] QA-015: Dashboard cards preserve spacing across desktop and mobile breakpoints.
- [ ] QA-016: Sidebar exposes the active workspace clearly.
- [ ] QA-017: Sidebar navigation remains usable after switching between all workspaces.
- [ ] QA-018: Mobile navigation opens and closes without changing the current route state.
- [ ] QA-019: Mobile navigation closes after selecting a workspace.
- [ ] QA-020: Current season context remains visible in the desktop sidebar.
- [ ] QA-021: System status treatment is visually distinct from navigation items.
- [ ] QA-022: Sidebar labels remain readable at the smallest supported viewport.
- [ ] QA-023: Topbar date context renders without overflowing.
- [ ] QA-024: Admin identity remains visible in the desktop command bar.
- [ ] QA-025: Topbar menu control has an accessible label.
- [ ] QA-026: Topbar controls preserve keyboard focus visibility.
- [ ] QA-027: Navigation icons retain consistent sizing across states.
- [ ] QA-028: Active navigation state is distinguishable without relying only on color.
- [ ] QA-029: Team registration rejects an empty team name.
- [ ] QA-030: Team registration rejects an empty captain name.
- [ ] QA-031: Team registration prevents accidental submission while a request is pending.
- [ ] QA-032: Team registration reports backend validation failures clearly.
- [ ] QA-033: Team registration clears the form after a successful creation.
- [ ] QA-034: Newly registered teams appear without requiring a full page reload.
- [ ] QA-035: Team cards expose captain information consistently.
- [ ] QA-036: Team cards display a stable roster position.
- [ ] QA-037: Team cards retain readable metadata on narrow screens.
- [ ] QA-038: Team management shows a useful empty state when no teams are registered.
- [ ] QA-039: Team management shows a useful loading state during fetch operations.
- [ ] QA-040: Team management exposes a retry path after a fetch failure.
- [ ] QA-041: Team names remain legible when unusually long names are entered.
- [ ] QA-042: Team form controls have visible labels and usable focus states.
- [ ] QA-043: Fixture creation requires a home team.