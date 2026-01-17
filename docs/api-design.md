# Planner API Design

## Base URL
- Development: `http://localhost:4000`
- WebSocket: `ws://localhost:4000`

## Authentication
All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## REST Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create new account |
| POST | `/auth/login` | Login, receive JWT |
| GET | `/auth/me` | Get current user |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces` | List user's workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:id` | Get workspace details |
| PATCH | `/workspaces/:id` | Update workspace |
| DELETE | `/workspaces/:id` | Delete workspace (owner only) |
| GET | `/workspaces/:id/members` | List members |
| POST | `/workspaces/:id/members` | Invite member |
| PATCH | `/workspaces/:id/members/:userId` | Update member role |
| DELETE | `/workspaces/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/tasks` | List tasks (supports filters) |
| POST | `/workspaces/:wsId/tasks` | Create task |
| GET | `/workspaces/:wsId/tasks/:id` | Get task details |
| PATCH | `/workspaces/:wsId/tasks/:id` | Update task |
| DELETE | `/workspaces/:wsId/tasks/:id` | Delete task |
| POST | `/workspaces/:wsId/tasks/:id/comments` | Add comment |
| GET | `/workspaces/:wsId/tasks/:id/comments` | List comments |

**Task Filters (query params)**:
- `status`: todo, in_progress, done, archived
- `priority`: urgent, high, medium, low
- `assigneeId`: UUID
- `projectId`: UUID
- `channelId`: UUID
- `tagIds`: comma-separated UUIDs
- `dueBefore`: ISO date
- `dueAfter`: ISO date
- `search`: text search
- `cursor`: pagination cursor
- `limit`: results per page (default 50, max 200)

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/projects` | List projects |
| POST | `/workspaces/:wsId/projects` | Create project |
| GET | `/workspaces/:wsId/projects/:id` | Get project |
| PATCH | `/workspaces/:wsId/projects/:id` | Update project |
| DELETE | `/workspaces/:wsId/projects/:id` | Delete project |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/channels` | List channels |
| POST | `/workspaces/:wsId/channels` | Create channel |
| GET | `/workspaces/:wsId/channels/:id` | Get channel |
| PATCH | `/workspaces/:wsId/channels/:id` | Update channel (notes) |
| DELETE | `/workspaces/:wsId/channels/:id` | Delete channel |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/tags` | List tags |
| POST | `/workspaces/:wsId/tags` | Create tag |
| PATCH | `/workspaces/:wsId/tags/:id` | Update tag |
| DELETE | `/workspaces/:wsId/tags/:id` | Delete tag |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/events` | List events (with date range) |
| POST | `/workspaces/:wsId/events` | Create event |
| GET | `/workspaces/:wsId/events/:id` | Get event |
| PATCH | `/workspaces/:wsId/events/:id` | Update event |
| DELETE | `/workspaces/:wsId/events/:id` | Delete event |

**Event Filters**:
- `start`: ISO date (range start)
- `end`: ISO date (range end)

### Time Blocks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/time-blocks` | List time blocks |
| POST | `/workspaces/:wsId/time-blocks` | Create time block |
| PATCH | `/workspaces/:wsId/time-blocks/:id` | Update time block |
| DELETE | `/workspaces/:wsId/time-blocks/:id` | Delete time block |

**Time Block Filters**:
- `date`: YYYY-MM-DD (required)
- `userId`: UUID (default: current user)

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/templates` | List templates |
| POST | `/workspaces/:wsId/templates` | Create template |
| GET | `/workspaces/:wsId/templates/:id` | Get template |
| DELETE | `/workspaces/:wsId/templates/:id` | Delete template |
| POST | `/workspaces/:wsId/templates/:id/apply` | Create tasks from template |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List user notifications |
| POST | `/notifications/:id/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/plan-day` | Generate daily plan |
| POST | `/ai/summarize-week` | Summarize week achievements |

### Weekly Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workspaces/:wsId/weekly-review` | Get weekly stats |

**Query params**:
- `weekStart`: YYYY-MM-DD (Monday of the week)

---

## WebSocket Events

### Connection
Connect to `ws://localhost:4000` with auth token:
```javascript
const socket = io('http://localhost:4000', {
  auth: { token: 'Bearer <jwt>' }
});
```

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join:workspace` | `{ workspaceId }` | Join workspace room |
| `leave:workspace` | `{ workspaceId }` | Leave workspace room |

### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `task:created` | `Task` | New task in workspace |
| `task:updated` | `Task` | Task updated |
| `task:deleted` | `{ id, workspaceId }` | Task deleted |
| `comment:created` | `Comment` | New comment |
| `event:created` | `Event` | New calendar event |
| `event:updated` | `Event` | Event updated |
| `event:deleted` | `{ id, workspaceId }` | Event deleted |
| `time-block:created` | `TimeBlock` | New time block |
| `time-block:updated` | `TimeBlock` | Time block updated |
| `time-block:deleted` | `{ id, workspaceId }` | Time block deleted |
| `notification:new` | `Notification` | New notification for user |
| `member:joined` | `{ userId, workspaceId, role }` | New member |
| `member:updated` | `{ userId, workspaceId, role }` | Member role changed |
| `member:left` | `{ userId, workspaceId }` | Member left/removed |

---

## Request/Response Examples

### Create Task
```http
POST /workspaces/:wsId/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Design homepage",
  "descriptionMd": "Create wireframes and mockups",
  "status": "todo",
  "priority": "high",
  "dueAt": "2026-01-20T17:00:00Z",
  "color": "indigo",
  "projectId": "uuid-project",
  "channelId": "uuid-channel",
  "tagIds": ["uuid-tag-1", "uuid-tag-2"],
  "assigneeId": "uuid-user"
}
```

Response:
```json
{
  "id": "uuid-task",
  "workspaceId": "uuid-workspace",
  "title": "Design homepage",
  "descriptionMd": "Create wireframes and mockups",
  "status": "todo",
  "priority": "high",
  "dueAt": "2026-01-20T17:00:00Z",
  "color": "indigo",
  "projectId": "uuid-project",
  "channelId": "uuid-channel",
  "tagIds": ["uuid-tag-1", "uuid-tag-2"],
  "createdById": "uuid-creator",
  "assigneeId": "uuid-user",
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### AI Plan Day
```http
POST /ai/plan-day
Content-Type: application/json
Authorization: Bearer <token>

{
  "workspaceId": "uuid-workspace",
  "date": "2026-01-16",
  "goals": ["Finish homepage design", "Review PRs"],
  "constraints": {
    "workdayStart": "09:00",
    "workdayEnd": "17:00",
    "focusBlocksMinutes": [50, 25]
  }
}
```

Response:
```json
{
  "date": "2026-01-16",
  "blocks": [
    { "start": "09:00", "end": "09:30", "title": "Daily standup + planning" },
    { "start": "09:30", "end": "10:20", "title": "Deep work: Homepage design", "relatedTaskId": "uuid-task" },
    { "start": "10:20", "end": "10:30", "title": "Break" },
    { "start": "10:30", "end": "11:20", "title": "Continue homepage design", "relatedTaskId": "uuid-task" },
    { "start": "11:20", "end": "12:00", "title": "Review PRs", "relatedTaskId": "uuid-task-2" }
  ],
  "notes": ["Consider time-boxing PR reviews to 40 min max"]
}
```

---

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "path": ["title"], "message": "Required" }
  ]
}
```

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Forbidden: insufficient permissions"
}
```

```json
{
  "statusCode": 404,
  "message": "Task not found"
}
```

