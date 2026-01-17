## API (MVP) — REST + Realtime

Base URL: `http://localhost:4000`

### Conventions

- **Auth**: `Authorization: Bearer <jwt>`
- **Error shape**:

```json
{ "error": { "code": "BAD_REQUEST", "message": "..." } }
```

---

## REST endpoints (MVP)

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

### Workspaces
- `GET /workspaces`
- `POST /workspaces`
- `GET /workspaces/:id`
- `GET /workspaces/:id/members`
- `POST /workspaces/:id/members` (owner/admin)

### Tasks
- `GET /workspaces/:workspaceId/tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `POST /tasks/:id/comments`
- `GET /tasks/:id/comments`

### Events
- `GET /workspaces/:workspaceId/events`
- `POST /events`
- `PATCH /events/:id`

### Time blocks (Today)
- `GET /workspaces/:workspaceId/days/:date/time-blocks`
- `PUT /workspaces/:workspaceId/days/:date/time-blocks` (replace list)

### Templates
- `GET /workspaces/:workspaceId/templates`
- `POST /templates`
- `POST /templates/:id/apply`

### Weekly review + AI
- `GET /workspaces/:workspaceId/weekly-review?weekStart=YYYY-MM-DD`
- `POST /ai/plan-day`
- `POST /ai/summarize-week`

### Notifications
- `GET /notifications`
- `PATCH /notifications/:id`

---

## Realtime (Socket.IO)

Namespace: `/rt`

Client emits:
- `workspace:join` `{ workspaceId }`

Server emits (room = workspaceId):
- `task:created` `{ task }`
- `task:updated` `{ task }`
- `comment:created` `{ comment }`
- `notification:created` `{ notification }`

