-- Readable SQL mirror of Prisma schema (authoritative = prisma/schema.prisma)
-- Requires: pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums (prisma maps to native enums)
DO $$ BEGIN
  CREATE TYPE "WorkspaceRole" AS ENUM ('owner','admin','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('todo','in_progress','done','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('urgent','high','medium','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('mention','assigned','reminder','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ReminderStatus" AS ENUM ('scheduled','delivered','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Workspace" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "WorkspaceMembership" (
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role "WorkspaceRole" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("workspaceId","userId")
);

CREATE TABLE IF NOT EXISTS "Channel" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "notesMd" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspaceId", name)
);

CREATE TABLE IF NOT EXISTS "Project" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  "startAt" TIMESTAMPTZ,
  "endAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspaceId", name)
);

CREATE TABLE IF NOT EXISTS "Tag" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspaceId", name)
);

CREATE TABLE IF NOT EXISTS "Task" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "projectId" UUID REFERENCES "Project"(id) ON DELETE SET NULL,
  "channelId" UUID REFERENCES "Channel"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  "descriptionMd" TEXT,
  "notesMd" TEXT,
  status "TaskStatus" NOT NULL DEFAULT 'todo',
  priority "Priority" NOT NULL DEFAULT 'medium',
  "dueAt" TIMESTAMPTZ,
  color TEXT,
  "createdById" UUID NOT NULL REFERENCES "User"(id),
  "assigneeId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "TaskTag" (
  "taskId" UUID NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "tagId" UUID NOT NULL REFERENCES "Tag"(id) ON DELETE CASCADE,
  PRIMARY KEY ("taskId","tagId")
);

CREATE TABLE IF NOT EXISTS "Comment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId" UUID NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "authorId" UUID NOT NULL REFERENCES "User"(id),
  "bodyMd" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CommentMention" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "commentId" UUID NOT NULL REFERENCES "Comment"(id) ON DELETE CASCADE,
  "mentionedUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("commentId","mentionedUserId")
);

CREATE TABLE IF NOT EXISTS "Event" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "descriptionMd" TEXT,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "allDay" BOOLEAN NOT NULL DEFAULT false,
  color TEXT,
  "createdById" UUID NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "TimeBlock" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  "startMin" INT NOT NULL,
  "endMin" INT NOT NULL,
  title TEXT NOT NULL,
  "relatedTaskId" UUID REFERENCES "Task"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Template" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  "createdById" UUID NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Habit" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  "targetCount" INT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AnalyticsSnapshot" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  day TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("workspaceId", day)
);

CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type "NotificationType" NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "readAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "Reminder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status "ReminderStatus" NOT NULL DEFAULT 'scheduled',
  "remindAt" TIMESTAMPTZ NOT NULL,
  "taskId" UUID REFERENCES "Task"(id) ON DELETE CASCADE,
  "eventId" UUID REFERENCES "Event"(id) ON DELETE CASCADE,
  label TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deliveredAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_workspace_status ON "Task" ("workspaceId", status);
CREATE INDEX IF NOT EXISTS idx_task_workspace_assignee ON "Task" ("workspaceId", "assigneeId");
CREATE INDEX IF NOT EXISTS idx_task_workspace_due ON "Task" ("workspaceId", "dueAt");
CREATE INDEX IF NOT EXISTS idx_comment_task_created ON "Comment" ("taskId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_event_workspace_start ON "Event" ("workspaceId", "startAt");
CREATE INDEX IF NOT EXISTS idx_timeblock_workspace_user_date ON "TimeBlock" ("workspaceId", "userId", date);
CREATE INDEX IF NOT EXISTS idx_notification_user_created ON "Notification" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_reminder_status_remind ON "Reminder" (status, "remindAt");

