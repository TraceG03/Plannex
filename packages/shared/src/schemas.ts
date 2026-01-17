import { z } from "zod";

export const WorkspaceRoleSchema = z.enum(["owner", "admin", "member"]);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const PrioritySchema = z.enum(["urgent", "high", "medium", "low"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "archived"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const IdSchema = z.string().uuid();

export const EmailSchema = z.string().email();

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const AuthUserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: z.string().min(1).max(120).nullable(),
  createdAt: z.string()
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(200)
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SignupRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120).optional()
});
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: AuthUserSchema
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const CreateTaskSchema = z.object({
  workspaceId: IdSchema,
  projectId: IdSchema.nullable().optional(),
  channelId: IdSchema.nullable().optional(),
  title: z.string().min(1).max(240),
  descriptionMd: z.string().max(50_000).nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  tagIds: z.array(IdSchema).default([]),
  assigneeId: IdSchema.nullable().optional()
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: IdSchema
});
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

export const TaskSchema = z.object({
  id: IdSchema,
  workspaceId: IdSchema,
  projectId: IdSchema.nullable(),
  channelId: IdSchema.nullable(),
  title: z.string(),
  descriptionMd: z.string().nullable(),
  status: TaskStatusSchema,
  priority: PrioritySchema,
  dueAt: z.string().datetime({ offset: true }).nullable(),
  color: z.string().nullable(),
  tagIds: z.array(IdSchema),
  createdById: IdSchema,
  assigneeId: IdSchema.nullable(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateCommentSchema = z.object({
  taskId: IdSchema,
  bodyMd: z.string().min(1).max(50_000)
});
export type CreateComment = z.infer<typeof CreateCommentSchema>;

export const CommentSchema = z.object({
  id: IdSchema,
  taskId: IdSchema,
  authorId: IdSchema,
  bodyMd: z.string(),
  createdAt: z.string().datetime({ offset: true })
});
export type Comment = z.infer<typeof CommentSchema>;

export const CreateEventSchema = z.object({
  workspaceId: IdSchema,
  title: z.string().min(1).max(240),
  descriptionMd: z.string().max(50_000).nullable().optional(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  allDay: z.boolean().default(false),
  color: z.string().max(32).nullable().optional()
});
export type CreateEvent = z.infer<typeof CreateEventSchema>;

export const EventSchema = z.object({
  id: IdSchema,
  workspaceId: IdSchema,
  title: z.string(),
  descriptionMd: z.string().nullable(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  allDay: z.boolean(),
  color: z.string().nullable(),
  createdById: IdSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true })
});
export type Event = z.infer<typeof EventSchema>;

export const PlanMyDayRequestSchema = z.object({
  workspaceId: IdSchema,
  date: z.string().date().optional(),
  goals: z.array(z.string().min(1).max(240)).default([]),
  constraints: z
    .object({
      workdayStart: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
      workdayEnd: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
      focusBlocksMinutes: z.array(z.number().int().min(10).max(240)).default([50])
    })
    .default({})
});
export type PlanMyDayRequest = z.infer<typeof PlanMyDayRequestSchema>;

export const PlanMyDayResponseSchema = z.object({
  date: z.string().date(),
  blocks: z.array(
    z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      title: z.string().min(1).max(240),
      relatedTaskId: IdSchema.nullable().optional()
    })
  ),
  notes: z.array(z.string()).default([])
});
export type PlanMyDayResponse = z.infer<typeof PlanMyDayResponseSchema>;

export const SummarizeWeekRequestSchema = z.object({
  workspaceId: IdSchema,
  weekStart: z.string().date()
});
export type SummarizeWeekRequest = z.infer<typeof SummarizeWeekRequestSchema>;

export const SummarizeWeekResponseSchema = z.object({
  weekStart: z.string().date(),
  highlights: z.array(z.string()),
  wins: z.array(z.string()),
  risks: z.array(z.string()),
  nextWeekFocus: z.array(z.string())
});
export type SummarizeWeekResponse = z.infer<typeof SummarizeWeekResponseSchema>;

