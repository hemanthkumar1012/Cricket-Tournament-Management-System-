# CricPulse — Cricket Tournament Management System

A full-stack cricket tournament operations platform with a modern React/Vite dashboard and Spring Boot backend.

## Frontend
Run npm install followed by npm run dev from the frontend directory.
Optional API base URL: VITE_API_BASE_URL=http://localhost:8080

## Tournament workflow
- Overview dashboard with tournament KPIs
- Team registration and active team cards
- Fixture creation and match result entry
- Live score center
- Points table and ranking snapshot
- Responsive desktop, tablet and mobile layouts
- Shared API client with consistent JSON and error handling

## Existing API routes
- GET /api/teams
- POST /api/teams
- GET /api/teams/standings
- GET /api/matches
- POST /api/matches
- PUT /api/matches/:id/result
- GET /api/live

## UI direction
CricPulse uses a focused green and lime cricket-operations visual system, dense information hierarchy, reusable cards, clear status badges and responsive tables. The goal is fast tournament administration during an active match day.
