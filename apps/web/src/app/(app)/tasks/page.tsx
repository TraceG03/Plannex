"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useWorkspace } from "@/lib/workspace-context";
import api, { type Task, type CreateTask, type Tag, type Project, type Member } from "@/lib/api";

type ViewMode = "list" | "kanban";

export default function TasksPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const wsId = currentWorkspace?.id ?? "";

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", wsId, { status: statusFilter, priority: priorityFilter }],
    queryFn: () =>
      api.tasks.list(wsId, {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        limit: "100"
      }),
    enabled: !!wsId
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags", wsId],
    queryFn: () => api.tags.list(wsId),
    enabled: !!wsId
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", wsId],
    queryFn: () => api.projects.list(wsId),
    enabled: !!wsId
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", wsId],
    queryFn: () => api.workspaces.listMembers(wsId),
    enabled: !!wsId
  });

  const tasks = tasksData?.items ?? [];

  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTask) => api.tasks.create(wsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", wsId] });
      setShowNewTask(false);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTask> }) =>
      api.tasks.update(wsId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", wsId] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.delete(wsId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", wsId] })
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">Tasks</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-zinc-700 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === "kanban" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Kanban
            </button>
          </div>

          <button
            onClick={() => setShowNewTask(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <PlusIcon className="h-4 w-4" />
            New Task
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-zinc-800 px-6 py-3">
        <select
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
        >
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter ?? ""}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === "list" ? (
          <ListView
            tasks={tasks}
            tags={tags}
            projects={projects}
            members={members}
            onUpdate={(id, data) => updateTaskMutation.mutate({ id, data })}
            onDelete={(id) => deleteTaskMutation.mutate(id)}
          />
        ) : (
          <KanbanView
            tasks={tasks}
            onUpdate={(id, data) => updateTaskMutation.mutate({ id, data })}
          />
        )}
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <NewTaskModal
          projects={projects}
          tags={tags}
          members={members}
          onClose={() => setShowNewTask(false)}
          onCreate={(data) => createTaskMutation.mutate(data)}
          isLoading={createTaskMutation.isPending}
        />
      )}
    </div>
  );
}

function ListView({
  tasks,
  tags,
  projects,
  members,
  onUpdate,
  onDelete
}: {
  tasks: Task[];
  tags: Tag[];
  projects: Project[];
  members: Member[];
  onUpdate: (id: string, data: Partial<CreateTask>) => void;
  onDelete: (id: string) => void;
}) {
  const priorityColors = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-zinc-500"
  };

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        const assignee = members.find((m) => m.userId === task.assigneeId);

        return (
          <div
            key={task.id}
            className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700"
          >
            {/* Checkbox */}
            <button
              onClick={() =>
                onUpdate(task.id, { status: task.status === "done" ? "todo" : "done" })
              }
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                task.status === "done"
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-zinc-600 hover:border-zinc-500"
              }`}
            >
              {task.status === "done" && (
                <CheckIcon className="h-3 w-3" />
              )}
            </button>

            {/* Priority indicator */}
            <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${task.status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
                {task.title}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                {project && <span>📁 {project.name}</span>}
                {task.dueAt && <span>📅 {dayjs(task.dueAt).format("MMM D")}</span>}
                {assignee && <span>👤 {assignee.name ?? assignee.email}</span>}
              </div>
            </div>

            {/* Status */}
            <select
              value={task.status}
              onChange={(e) => onUpdate(task.id, { status: e.target.value as Task["status"] })}
              className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            {/* Delete */}
            <button
              onClick={() => onDelete(task.id)}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="py-12 text-center text-zinc-500">
          No tasks found. Create your first task!
        </div>
      )}
    </div>
  );
}

function KanbanView({
  tasks,
  onUpdate
}: {
  tasks: Task[];
  onUpdate: (id: string, data: Partial<CreateTask>) => void;
}) {
  const columns = [
    { id: "todo", label: "To Do", color: "border-zinc-600" },
    { id: "in_progress", label: "In Progress", color: "border-blue-500" },
    { id: "done", label: "Done", color: "border-green-500" }
  ];

  const priorityColors = {
    urgent: "border-l-red-500",
    high: "border-l-orange-500",
    medium: "border-l-yellow-500",
    low: "border-l-zinc-500"
  };

  return (
    <div className="flex gap-6 h-full">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <div key={column.id} className="flex w-80 flex-shrink-0 flex-col">
            <div className={`mb-4 flex items-center gap-2 border-b-2 pb-2 ${column.color}`}>
              <h3 className="font-medium text-white">{column.label}</h3>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg border border-zinc-800 border-l-4 bg-zinc-900/50 p-4 ${priorityColors[task.priority]}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const taskId = e.dataTransfer.getData("taskId");
                    if (taskId !== task.id) {
                      onUpdate(taskId, { status: column.id as Task["status"] });
                    }
                  }}
                >
                  <div className="font-medium text-white">{task.title}</div>
                  {task.dueAt && (
                    <div className="mt-2 text-xs text-zinc-500">
                      📅 {dayjs(task.dueAt).format("MMM D, HH:mm")}
                    </div>
                  )}
                </div>
              ))}
              {/* Drop zone for empty columns */}
              <div
                className="min-h-[100px] rounded-lg border-2 border-dashed border-zinc-800"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const taskId = e.dataTransfer.getData("taskId");
                  onUpdate(taskId, { status: column.id as Task["status"] });
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewTaskModal({
  projects,
  tags,
  members,
  onClose,
  onCreate,
  isLoading
}: {
  projects: Project[];
  tags: Tag[];
  members: Member[];
  onClose: () => void;
  onCreate: (data: CreateTask) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [projectId, setProjectId] = useState<string>("");
  const [dueAt, setDueAt] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      priority,
      projectId: projectId || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      assigneeId: assigneeId || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl animate-slide-up">
        <h2 className="mb-4 text-lg font-semibold text-white">New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white focus:border-violet-500 focus:outline-none"
              placeholder="Task title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Due Date</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
