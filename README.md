# Planner - Cross-Platform Task & Team Collaboration App

A modern planner application for personal productivity and team collaboration, featuring AI-powered assistance, time blocking, and multiple views.

## Features (MVP)

- **Authentication**: Email/password signup & login
- **Workspaces**: Team collaboration with role-based access (owner/admin/member)
- **Tasks**: Full CRUD with status, priority, due dates, color coding, tags
- **Views**: List view, Kanban board
- **Calendar**: Events with daily/weekly/monthly views
- **Time Blocking**: Daily view with draggable time blocks linked to tasks
- **Projects**: Group and organize tasks by project
- **Channels**: Team channels with markdown notes
- **Comments**: @mention support in task comments
- **Templates**: Create task lists from reusable templates
- **AI Assistant**: "Plan my day" and "Summarize my week" features
- **Notifications**: In-app notifications for mentions, assignments, reminders
- **Weekly Review**: Dashboard showing completed tasks and achievements

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web Frontend | Next.js 16, React 19, Tailwind v4, React Query |
| Backend | NestJS 11, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7, BullMQ |
| Realtime | Socket.IO |
| AI | OpenAI API (structured outputs) |
| Auth | JWT, Passport |
| Validation | Zod (shared schemas) |

## Project Structure

```
planner-monorepo/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── prisma/          # Database schema & migrations
│   │   └── src/
│   │       ├── modules/     # Feature modules (auth, tasks, etc.)
│   │       └── common/      # Shared utilities
│   └── web/                 # Next.js frontend
│       └── src/
│           ├── app/         # App router pages
│           ├── components/  # React components
│           └── lib/         # API client, contexts
├── packages/
│   ├── shared/              # Shared types, Zod schemas, utilities
│   └── ui/                  # Shared UI components
└── docs/                    # Documentation
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and Redis)
- pnpm or npm

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url>
   cd planner-monorepo
   npm install
   ```

2. **Start databases**:
   ```bash
   npm run db:up
   ```

3. **Setup environment**:
   ```bash
   # API
   cp apps/api/env.example apps/api/.env
   
   # Web (optional, defaults work for local dev)
   cp apps/web/env.example apps/web/.env.local
   ```

4. **Run database migrations and seed**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run seed
   ```

5. **Start development servers**:
   ```bash
   npm run dev
   ```

   This starts:
   - API: http://localhost:4000
   - Web: http://localhost:3000

### Demo Credentials

After seeding, you can login with:
- **Email**: alice@example.com
- **Password**: password123

Or create a new account.

## Development

### Available Scripts

```bash
# Start all services
npm run dev

# Start individual services
npm run dev:api    # API only
npm run dev:web    # Web only

# Database
npm run db:up      # Start PostgreSQL and Redis
npm run db:down    # Stop databases
npm run db:reset   # Reset database (WARNING: deletes all data)
npm run seed       # Seed demo data

# Build
npm run build -ws  # Build all packages

# Test
npm run test -ws   # Run all tests
```

### API Documentation

See [docs/api-design.md](docs/api-design.md) for full API documentation.

### Adding a New Feature

1. Update Prisma schema if needed (`apps/api/prisma/schema.prisma`)
2. Add Zod schemas to `packages/shared/src/schemas.ts`
3. Create backend module in `apps/api/src/modules/`
4. Add frontend pages/components in `apps/web/src/`

## Configuration

### Environment Variables

**API** (`apps/api/.env`):
```env
DATABASE_URL=postgresql://planner:planner@localhost:5432/planner
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=4000
APP_ORIGIN=http://localhost:3000

# AI (optional)
OPENAI_ENABLED=false
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

**Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Enable AI Features

1. Set `OPENAI_ENABLED=true` in API `.env`
2. Add your `OPENAI_API_KEY`
3. Restart the API server

## Roadmap

See [docs/product-spec.md](docs/product-spec.md) for the full feature roadmap.

### V2 Features (Planned)
- Gantt chart with task dependencies
- Advanced analytics and productivity trends
- Personalized habit builder with AI suggestions
- Integrations (Google Calendar, Slack)
- Voice input with command parsing
- Custom view builder
- Offline sync

See [docs/v2-plan.md](docs/v2-plan.md) for implementation details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT