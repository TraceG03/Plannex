const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiError extends Error {
  status: number;
  data?: unknown;
}

function createApiError(message: string, status: number, data?: unknown): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.data = data;
  return error;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw createApiError(data?.message ?? res.statusText, res.status, data);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// Auth
export const auth = {
  signup: (data: { email: string; password: string; name?: string }) =>
    request<{ accessToken: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  me: () => request<User>("/auth/me")
};

// Workspaces
export const workspaces = {
  list: () => request<Workspace[]>("/workspaces"),
  create: (data: { name: string }) =>
    request<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => request<Workspace>(`/workspaces/${id}`),
  update: (id: string, data: { name?: string }) =>
    request<Workspace>(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/workspaces/${id}`, { method: "DELETE" }),
  listMembers: (id: string) => request<Member[]>(`/workspaces/${id}/members`),
  inviteMember: (id: string, data: { email: string; role?: string }) =>
    request<Member>(`/workspaces/${id}/members`, { method: "POST", body: JSON.stringify(data) })
};

// Tasks
export const tasks = {
  list: (wsId: string, params?: TaskFilters) => {
    const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<{ items: Task[]; nextCursor: string | null }>(`/workspaces/${wsId}/tasks${query}`);
  },
  create: (wsId: string, data: CreateTask) =>
    request<Task>(`/workspaces/${wsId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  get: (wsId: string, id: string) => request<Task>(`/workspaces/${wsId}/tasks/${id}`),
  update: (wsId: string, id: string, data: Partial<CreateTask>) =>
    request<Task>(`/workspaces/${wsId}/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (wsId: string, id: string) =>
    request<{ success: boolean }>(`/workspaces/${wsId}/tasks/${id}`, { method: "DELETE" })
};

// Comments
export const comments = {
  list: (wsId: string, taskId: string) =>
    request<Comment[]>(`/workspaces/${wsId}/tasks/${taskId}/comments`),
  create: (wsId: string, taskId: string, data: { bodyMd: string }) =>
    request<Comment>(`/workspaces/${wsId}/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(data)
    })
};

// Tags
export const tags = {
  list: (wsId: string) => request<Tag[]>(`/workspaces/${wsId}/tags`),
  create: (wsId: string, data: { name: string; color?: string }) =>
    request<Tag>(`/workspaces/${wsId}/tags`, { method: "POST", body: JSON.stringify(data) }),
  delete: (wsId: string, id: string) =>
    request<{ success: boolean }>(`/workspaces/${wsId}/tags/${id}`, { method: "DELETE" })
};

// Projects
export const projects = {
  list: (wsId: string) => request<Project[]>(`/workspaces/${wsId}/projects`),
  create: (wsId: string, data: CreateProject) =>
    request<Project>(`/workspaces/${wsId}/projects`, { method: "POST", body: JSON.stringify(data) }),
  get: (wsId: string, id: string) => request<Project>(`/workspaces/${wsId}/projects/${id}`),
  update: (wsId: string, id: string, data: Partial<CreateProject>) =>
    request<Project>(`/workspaces/${wsId}/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (wsId: string, id: string) =>
    request<{ success: boolean }>(`/workspaces/${wsId}/projects/${id}`, { method: "DELETE" })
};

// Channels
export const channels = {
  list: (wsId: string) => request<Channel[]>(`/workspaces/${wsId}/channels`),
  create: (wsId: string, data: { name: string; description?: string }) =>
    request<Channel>(`/workspaces/${wsId}/channels`, { method: "POST", body: JSON.stringify(data) }),
  get: (wsId: string, id: string) => request<Channel>(`/workspaces/${wsId}/channels/${id}`),
  update: (wsId: string, id: string, data: { name?: string; notesMd?: string }) =>
    request<Channel>(`/workspaces/${wsId}/channels/${id}`, { method: "PATCH", body: JSON.stringify(data) })
};

// Events
export const events = {
  list: (wsId: string, params?: { start?: string; end?: string }) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<CalendarEvent[]>(`/workspaces/${wsId}/events${query}`);
  },
  create: (wsId: string, data: CreateEvent) =>
    request<CalendarEvent>(`/workspaces/${wsId}/events`, { method: "POST", body: JSON.stringify(data) }),
  update: (wsId: string, id: string, data: Partial<CreateEvent>) =>
    request<CalendarEvent>(`/workspaces/${wsId}/events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (wsId: string, id: string) =>
    request<{ success: boolean }>(`/workspaces/${wsId}/events/${id}`, { method: "DELETE" })
};

// Time Blocks
export const timeBlocks = {
  list: (wsId: string, date: string, userId?: string) => {
    const params = new URLSearchParams({ date });
    if (userId) params.set("userId", userId);
    return request<TimeBlock[]>(`/workspaces/${wsId}/time-blocks?${params}`);
  },
  create: (wsId: string, data: CreateTimeBlock) =>
    request<TimeBlock>(`/workspaces/${wsId}/time-blocks`, { method: "POST", body: JSON.stringify(data) }),
  update: (wsId: string, id: string, data: Partial<CreateTimeBlock>) =>
    request<TimeBlock>(`/workspaces/${wsId}/time-blocks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (wsId: string, id: string) =>
    request<{ success: boolean }>(`/workspaces/${wsId}/time-blocks/${id}`, { method: "DELETE" }),
  batchCreate: (wsId: string, date: string, blocks: Omit<CreateTimeBlock, "date">[]) =>
    request<TimeBlock[]>(`/workspaces/${wsId}/time-blocks/batch`, {
      method: "POST",
      body: JSON.stringify({ date, blocks })
    })
};

// Templates
export const templates = {
  list: (wsId: string) => request<Template[]>(`/workspaces/${wsId}/templates`),
  create: (wsId: string, data: CreateTemplate) =>
    request<Template>(`/workspaces/${wsId}/templates`, { method: "POST", body: JSON.stringify(data) }),
  apply: (wsId: string, id: string, options?: { projectId?: string; channelId?: string }) =>
    request<{ tasksCreated: number; tasks: Task[] }>(`/workspaces/${wsId}/templates/${id}/apply`, {
      method: "POST",
      body: JSON.stringify(options ?? {})
    })
};

// Notifications
export const notifications = {
  list: (params?: { unreadOnly?: boolean; limit?: number }) => {
    const query = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return request<Notification[]>(`/notifications${query}`);
  },
  unreadCount: () => request<{ count: number }>("/notifications/count"),
  markRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () =>
    request<{ count: number }>("/notifications/read-all", { method: "POST" })
};

// AI
export const ai = {
  planDay: (data: {
    workspaceId: string;
    date?: string;
    goals?: string[];
    constraints?: { workdayStart?: string; workdayEnd?: string; focusBlocksMinutes?: number[] };
  }) => request<PlanDayResponse>("/ai/plan-day", { method: "POST", body: JSON.stringify(data) }),

  summarizeWeek: (data: { workspaceId: string; weekStart: string }) =>
    request<SummarizeWeekResponse>("/ai/summarize-week", { method: "POST", body: JSON.stringify(data) })
};

// Weekly Review
export const review = {
  get: (wsId: string, weekStart: string) =>
    request<WeeklyReview>(`/workspaces/${wsId}/weekly-review?weekStart=${weekStart}`)
};

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  role?: string;
  memberCount?: number;
  taskCount?: number;
  projectCount?: number;
  createdAt: string;
}

export interface Member {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  joinedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null;
  channelId: string | null;
  title: string;
  descriptionMd: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "urgent" | "high" | "medium" | "low";
  dueAt: string | null;
  color: string | null;
  tagIds: string[];
  createdById: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTask {
  title: string;
  descriptionMd?: string | null;
  status?: Task["status"];
  priority?: Task["priority"];
  dueAt?: string | null;
  color?: string | null;
  projectId?: string | null;
  channelId?: string | null;
  tagIds?: string[];
  assigneeId?: string | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  channelId?: string;
  tagIds?: string;
  search?: string;
  cursor?: string;
  limit?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author?: { id: string; email: string; name: string | null };
  bodyMd: string;
  mentionedUserIds?: string[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  taskCount?: number;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  startAt: string | null;
  endAt: string | null;
  taskCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProject {
  name: string;
  description?: string;
  color?: string;
  startAt?: string;
  endAt?: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  notesMd: string | null;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  title: string;
  descriptionMd: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvent {
  title: string;
  descriptionMd?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: string | null;
}

export interface TimeBlock {
  id: string;
  workspaceId: string;
  userId: string;
  date: string;
  startMin: number;
  endMin: number;
  title: string;
  relatedTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeBlock {
  date: string;
  startMin: number;
  endMin: number;
  title: string;
  relatedTaskId?: string | null;
}

export interface Template {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  data: { tasks: { title: string; priority?: string; color?: string }[] };
  createdById: string;
  createdAt: string;
}

export interface CreateTemplate {
  name: string;
  description?: string;
  data: { tasks: { title: string; priority?: string; color?: string }[] };
}

export interface Notification {
  id: string;
  workspaceId: string;
  type: "mention" | "assigned" | "reminder" | "system";
  title: string;
  body: string | null;
  data: unknown;
  createdAt: string;
  readAt: string | null;
}

export interface PlanDayResponse {
  date: string;
  blocks: { start: string; end: string; title: string; relatedTaskId?: string | null }[];
  notes: string[];
}

export interface SummarizeWeekResponse {
  weekStart: string;
  highlights: string[];
  wins: string[];
  risks: string[];
  nextWeekFocus: string[];
}

export interface WeeklyReview {
  weekStart: string;
  weekEnd: string;
  summary: {
    completed: number;
    inProgress: number;
    created: number;
    overdue: number;
  };
  completedTasks: {
    id: string;
    title: string;
    priority: string;
    completedAt: string;
    projectName: string | null;
  }[];
  topProjects: {
    id: string;
    name: string;
    completedCount: number;
    totalCount: number;
  }[];
  upcomingDeadlines: {
    id: string;
    title: string;
    dueAt: string;
    priority: string;
  }[];
}

export default {
  auth,
  workspaces,
  tasks,
  comments,
  tags,
  projects,
  channels,
  events,
  timeBlocks,
  templates,
  notifications,
  ai,
  review
};
