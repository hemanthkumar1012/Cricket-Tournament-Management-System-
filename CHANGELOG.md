# Changelog

## 2.2.0 — Live innings and ball-by-ball scoring

- Added persistent innings and delivery records with database constraints.
- Added scorer workflows for starting innings and recording batter, bowler, extras and dismissals.
- Added scorecards with batting and bowling figures, run rate, extras and recent deliveries.
- Added second-innings chase targets and innings completion rules for overs, wickets and target reached.
- Added undo-last-delivery with score recalculation.
- Finalized ball-by-ball match totals through the existing standings engine.
- Prevented manual final-score writes from bypassing a live scorecard.
- Protected player history from reassignment or deletion after recorded deliveries.
- Added API regression tests for extras, undo, authorization, all-out handling and final standings.


## 2.1.0 — Player roster management

- Added admin-managed player registration.
- Added playing-role selection and team assignment.
- Added player reassignment and removal endpoints.
- Added searchable player roster UI.
- Added API tests for player creation, assignment, reassignment, deletion and authorization.

## 2.0.0 — Backend and production-readiness upgrade

- Standardized on FastAPI; removed the duplicate Spring Boot backend and committed Java build output.
- Added explicit SQLAlchemy relationships for teams, players, matches and winners.
- Persisted match scores and scheduled date/time.
- Added validation for duplicate teams, self-fixtures, missing teams and negative scores.
- Made result recording transactional and idempotent for completed matches.
- Added win/loss/tie statistics and consistent points-table rules.
- Added admin JWT authentication for write operations and a frontend sign-in flow.
- Added PostgreSQL configuration and a Docker Compose stack.
- Added backend API tests and frontend live-score normalization tests.
- Added live-score auto-refresh and improved provider response normalization.
- Documented local setup, deployment configuration, API routes and testing.
