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