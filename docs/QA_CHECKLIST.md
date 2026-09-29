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