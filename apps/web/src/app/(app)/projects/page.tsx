"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/workspace-context";
import api, { type Project, type CreateProject } from "@/lib/api";

export default function ProjectsPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const wsId = currentWorkspace?.id ?? "";

  const [showNewProject, setShowNewProject] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", wsId],
    queryFn: () => api.projects.list(wsId),
    enabled: !!wsId
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProject) => api.projects.create(wsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", wsId] });
      setShowNewProject(false);
    }
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
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">Projects</h1>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <PlusIcon className="h-4 w-4" />
          New Project
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="py-12 text-center text-zinc-500">
            No projects yet. Create your first project!
          </div>
        )}
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreate={(data) => createProjectMutation.mutate(data)}
          isLoading={createProjectMutation.isPending}
        />
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const progress = project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100)
    : 0;

  const colorClasses: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    violet: "from-violet-500 to-violet-600",
    emerald: "from-emerald-500 to-emerald-600",
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    orange: "from-orange-500 to-orange-600",
    default: "from-zinc-500 to-zinc-600"
  };

  const gradientClass = colorClasses[project.color ?? "default"] ?? colorClasses.default;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradientClass}`} />
        <span className="text-xs text-zinc-500">{project.taskCount} tasks</span>
      </div>

      <h3 className="mt-4 font-semibold text-white">{project.name}</h3>
      {project.description && (
        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Progress</span>
          <span className="text-zinc-300">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800">
          <div
            className={`h-2 rounded-full bg-gradient-to-r ${gradientClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function NewProjectModal({
  onClose,
  onCreate,
  isLoading
}: {
  onClose: () => void;
  onCreate: (data: CreateProject) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("indigo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, description: description || undefined, color });
  };

  const colors = ["indigo", "violet", "emerald", "blue", "red", "orange"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl animate-slide-up">
        <h2 className="mb-4 text-lg font-semibold text-white">New Project</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white focus:border-violet-500 focus:outline-none"
              placeholder="Project name"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Color</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-lg bg-${c}-500 ${
                    color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                  }`}
                  style={{ backgroundColor: `var(--color-${c}-500, #8b5cf6)` }}
                />
              ))}
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
              disabled={isLoading || !name}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Project"}
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
