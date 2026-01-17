# V2 Implementation Plan

After MVP is stable, implement these features in order:

## Phase 1: Enhanced Project Management (2-3 weeks)

### Full Gantt Chart with Dependencies
1. **Schema Changes**:
   ```sql
   ALTER TABLE "Task" ADD COLUMN "dependsOnId" UUID REFERENCES "Task"("id");
   ALTER TABLE "Task" ADD COLUMN "estimatedHours" FLOAT;
   ALTER TABLE "Task" ADD COLUMN "startAt" TIMESTAMP;
   ```

2. **Backend**:
   - Add task dependency validation (no circular deps)
   - Auto-schedule tasks based on dependencies
   - Calculate critical path

3. **Frontend**:
   - Install `@nivo/gantt` or build custom with D3
   - Drag-to-resize tasks
   - Draw dependency lines
   - Show critical path highlighting

### Timeline/Agenda View
- Day-by-day scrolling view
- Group by date, show tasks + events inline
- Drag tasks to reschedule

---

## Phase 2: Advanced Analytics (2 weeks)

### Missed Deadlines Report
1. Track `originalDueAt` vs `dueAt` changes
2. Record when tasks became overdue
3. Charts: overdue rate over time, by project/assignee

### Productivity Trends
1. Daily analytics snapshots (cron job)
2. Metrics: tasks completed, focus time, meetings
3. Charts: weekly/monthly trends
4. Compare to personal average

### Implementation
```typescript
// New analytics service
interface DailyMetrics {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  timeBlocked: number; // minutes
  meetingTime: number;
  focusScore: number;
}

// Run daily at midnight
@Cron('0 0 * * *')
async snapshotDailyAnalytics() { ... }
```

---

## Phase 3: Personalized Habit Builder (2 weeks)

### Habit Tracking
1. **Schema**:
   ```sql
   CREATE TABLE "HabitLog" (
     "id" UUID PRIMARY KEY,
     "habitId" UUID REFERENCES "Habit"("id"),
     "date" DATE,
     "completed" BOOLEAN,
     "value" INT -- for quantifiable habits
   );
   ```

2. **Features**:
   - Daily habit check-ins
   - Streaks visualization
   - Habit completion calendar (GitHub-style)

### AI Suggestions
1. Analyze completed tasks patterns
2. Suggest habits based on goals
3. Optimal time suggestions based on time blocks

---

## Phase 4: Integrations (3-4 weeks)

### Google Calendar Sync
1. OAuth 2.0 setup with Google
2. Import: Pull events from Google Calendar
3. Export: Push Planner events to Google
4. Two-way sync with conflict resolution

### Slack Integration
1. Slack app with OAuth
2. Notifications: task assignments, mentions, reminders
3. Commands: `/planner task "Title"` to create tasks
4. Link unfurling for task URLs

### Email Integration
1. Email templates for notifications
2. Daily/weekly digest emails
3. Reply-to-complete tasks (parse inbound email)

---

## Phase 5: Voice Input (2 weeks)

### Web Speech API (Browser)
```typescript
// Web component
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  parseVoiceCommand(transcript);
};
```

### Command Parsing
1. Use OpenAI to parse intent:
   - "Add task review PRs due tomorrow"
   - "Schedule meeting with Bob at 3pm"
   - "What's on my schedule today?"

2. Structured output for actions:
   ```typescript
   interface VoiceCommand {
     intent: 'create_task' | 'create_event' | 'query' | 'update';
     entities: {
       title?: string;
       dueAt?: string;
       assignee?: string;
       // ...
     };
   }
   ```

---

## Phase 6: Custom View Builder (2-3 weeks)

### Saved Views
1. **Schema**:
   ```sql
   CREATE TABLE "SavedView" (
     "id" UUID PRIMARY KEY,
     "workspaceId" UUID,
     "userId" UUID,
     "name" VARCHAR(100),
     "type" VARCHAR(20), -- list, kanban, calendar, gantt
     "filters" JSONB,
     "sort" JSONB,
     "columns" JSONB,
     "isPublic" BOOLEAN
   );
   ```

2. **Features**:
   - Save current filter/sort as view
   - Share views with team
   - Pin favorite views to sidebar

### Custom Fields (Stretch)
1. Define custom fields per workspace
2. Field types: text, number, date, select, multi-select
3. Filter and sort by custom fields

---

## Phase 7: Offline Sync (3-4 weeks)

### Strategy: Optimistic Updates + Conflict Resolution

1. **IndexedDB for Local Storage**:
   ```typescript
   // Store pending operations
   interface PendingOperation {
     id: string;
     type: 'create' | 'update' | 'delete';
     entity: 'task' | 'event' | 'timeBlock';
     data: unknown;
     timestamp: number;
   }
   ```

2. **Sync Protocol**:
   - Queue operations when offline
   - Sync when back online
   - Server returns conflicts (last-write-wins or merge)
   - Show conflict resolution UI if needed

3. **Service Worker**:
   - Cache static assets
   - Cache API responses
   - Background sync for queued operations

4. **Libraries**:
   - Consider using `@tanstack/query-persist-client-core`
   - Or build custom with IndexedDB + service worker

---

## Technical Debt to Address

Before V2:
1. Add comprehensive E2E tests (Playwright)
2. Add API rate limiting
3. Add request logging and monitoring (OpenTelemetry)
4. Performance audit (lighthouse, bundle size)
5. Security audit (OWASP checklist)

---

## Timeline Summary

| Phase | Feature | Duration |
|-------|---------|----------|
| 1 | Gantt + Timeline | 2-3 weeks |
| 2 | Advanced Analytics | 2 weeks |
| 3 | Habit Builder | 2 weeks |
| 4 | Integrations | 3-4 weeks |
| 5 | Voice Input | 2 weeks |
| 6 | Custom Views | 2-3 weeks |
| 7 | Offline Sync | 3-4 weeks |

**Total: ~18-22 weeks for full V2**

Prioritize based on user feedback after MVP launch.
