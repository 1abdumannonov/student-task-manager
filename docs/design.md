# Design Document

## Architecture
- Modules: i18n, storage, schedule, app (composition)
- Single global entry point: `StudentTaskManager` (minimizes globals)
- Separation of concerns: persistence, domain logic, utilities, UI glue

## Data Models
- Subject: { id, name, color }
- Task: { id, title, subjectId|null, deadline: 'YYYY-MM-DD', completed: boolean }

## Notes
- Deadlines normalized to `YYYY-MM-DD` for simple grouping
- Week starts on Monday for grouping
- Language persisted to localStorage
