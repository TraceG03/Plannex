# Planner App - Product Specification

## Vision
A modern, cross-platform planner app for personal productivity and team collaboration with AI-powered assistance.

---

## Feature Roadmap

| Feature | MVP | V2 | V3 |
|---------|-----|----|----|
| **Auth** | Email/password | Google OAuth | SSO (SAML) |
| **Workspaces** | Create/join, roles (owner/admin/member) | Workspace settings, invites | Multi-org, audit logs |
| **Tasks** | CRUD, status, priority, due dates, color, tags | Recurring tasks, subtasks | Task dependencies |
| **Views** | List, Kanban | Agenda | Custom view builder |
| **Calendar** | Events, daily/weekly/monthly | Google Calendar sync | Multi-calendar overlay |
| **Time Blocking** | Daily time blocks, link to tasks | Drag-to-schedule | Auto-scheduling suggestions |
| **Projects** | Basic projects, task grouping | Timeline/Gantt view | Dependencies, critical path |
| **Comments** | @mentions, markdown | Reactions, threads | File attachments |
| **Channels** | Team notes, task grouping | Channel permissions | Channel archiving |
| **Templates** | Create tasks from templates | Template library, sharing | AI template generation |
| **AI Assistant** | "Plan my day", "Summarize week" | Habit suggestions, smart scheduling | Natural language task creation |
| **Notifications** | In-app notifications | Email notifications, push (web) | Mobile push, digest settings |
| **Reminders** | Scheduled reminders (BullMQ) | Custom reminder times | Location-based reminders |
| **Weekly Review** | View completed tasks, basic stats | Goals tracking, trends | OKR integration |
| **Analytics** | Task completion counts | Productivity trends, missed deadlines | Team performance, burndown |
| **Habits** | Basic habit tracking | Streaks, AI suggestions | Habit insights, correlations |
| **Search** | Basic full-text | Advanced filters | Saved searches, AI search |
| **Integrations** | — | Google Calendar, Slack | Zapier, API webhooks |
| **Voice Input** | — | Web Speech API | Server transcription, commands |
| **Offline** | — | Basic offline (tasks) | Full offline sync |
| **Platforms** | Web | Desktop (Tauri) | Mobile (Expo) |

---

## MVP Scope (Phase 1)

### Core Features
1. **Authentication**: Email/password signup & login
2. **Workspaces**: Create workspace, invite members, role-based access
3. **Tasks**: Full CRUD with status (todo/in_progress/done/archived), priority (urgent/high/medium/low), due dates, color coding, tags
4. **Views**: List view, Kanban board
5. **Calendar**: Create/view events, daily/weekly/monthly calendar views
6. **Time Blocking**: Daily view with draggable time blocks, link blocks to tasks
7. **Projects**: Group tasks by project
8. **Comments**: Add comments to tasks with @mention support
9. **Channels**: Team channels with notes
10. **Templates**: Create task lists from templates
11. **AI Assistant**: "Plan my day" and "Summarize my week" using OpenAI structured outputs
12. **Notifications**: In-app notifications for mentions, assignments, reminders
13. **Reminders**: Server-scheduled reminders via BullMQ
14. **Weekly Review**: Dashboard showing completed tasks, achievements

### Non-Goals for MVP
- Mobile app (web-first)
- Offline support
- External integrations
- Voice input
- Gantt charts with dependencies
- Advanced analytics

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  Web (Next.js)  │  Desktop (Tauri)  │  Mobile (Expo) - V3       │
└────────┬────────────────┬────────────────────┬──────────────────┘
         │                │                    │
         ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│                  NestJS (REST + WebSocket)                       │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │ Workspaces │ Tasks │ Events │ AI │ Notifications │ ... │
└────────┬────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌───────┐
│Postgres│ │ Redis │
│ Prisma │ │BullMQ │
└────────┘ └───────┘
```

---

## Data Model Summary

### Core Entities
- **User**: Authentication, profile
- **Workspace**: Team container, settings
- **WorkspaceMembership**: User-workspace relationship with role
- **Channel**: Team grouping with notes
- **Project**: Task grouping with timeline
- **Task**: Core work item with status, priority, tags, assignments
- **Tag**: Custom labels for tasks
- **Comment**: Discussion on tasks with mentions
- **Event**: Calendar events
- **TimeBlock**: Daily time allocation
- **Template**: Reusable task patterns
- **Notification**: In-app alerts
- **Reminder**: Scheduled alerts (BullMQ)
- **Habit**: Recurring behaviors (V2)
- **AnalyticsSnapshot**: Daily metrics (V2)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web Frontend | Next.js 16, React 19, Tailwind v4, React Query |
| State | React Query (server), React Context (local) |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Cache/Queue | Redis 7, BullMQ |
| Realtime | Socket.IO |
| AI | OpenAI API (structured outputs) |
| Auth | JWT, Passport |
| Validation | Zod (shared schemas) |
| Desktop | Tauri (V2) |
| Mobile | React Native Expo (V3) |

---

## Success Metrics (MVP)

1. User can sign up and create a workspace in < 60s
2. Task CRUD operations < 200ms latency
3. AI "plan my day" responds in < 3s
4. Realtime updates propagate in < 500ms
5. Weekly review loads in < 1s

