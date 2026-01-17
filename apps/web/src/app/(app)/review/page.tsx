"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useWorkspace } from "@/lib/workspace-context";
import api from "@/lib/api";

export default function ReviewPage() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id ?? "";

  // Get Monday of current week
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.startOf("week").add(1, "day").format("YYYY-MM-DD"); // Monday
  });

  const { data: review, isLoading } = useQuery({
    queryKey: ["review", wsId, weekStart],
    queryFn: () => api.review.get(wsId, weekStart),
    enabled: !!wsId
  });

  const goToPrevWeek = () => {
    setWeekStart(dayjs(weekStart).subtract(7, "day").format("YYYY-MM-DD"));
  };

  const goToNextWeek = () => {
    setWeekStart(dayjs(weekStart).add(7, "day").format("YYYY-MM-DD"));
  };

  const goToCurrentWeek = () => {
    const today = dayjs();
    setWeekStart(today.startOf("week").add(1, "day").format("YYYY-MM-DD"));
  };

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
        <div>
          <h1 className="text-xl font-semibold text-white">Weekly Review</h1>
          <p className="text-sm text-zinc-400">
            Week of {dayjs(weekStart).format("MMM D")} - {dayjs(weekStart).add(6, "day").format("MMM D, YYYY")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={goToCurrentWeek}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            This Week
          </button>
          <button
            onClick={goToNextWeek}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {review && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Completed" value={review.summary.completed} color="green" />
              <StatCard label="In Progress" value={review.summary.inProgress} color="blue" />
              <StatCard label="Created" value={review.summary.created} color="violet" />
              <StatCard label="Overdue" value={review.summary.overdue} color="red" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Completed Tasks */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <span className="text-green-400">✓</span> Completed Tasks
                </h2>
                <div className="space-y-2">
                  {review.completedTasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{task.title}</span>
                      <span className="text-xs text-zinc-500">
                        {dayjs(task.completedAt).format("MMM D")}
                      </span>
                    </div>
                  ))}
                  {review.completedTasks.length === 0 && (
                    <p className="text-sm text-zinc-500">No tasks completed this week</p>
                  )}
                </div>
              </div>

              {/* Top Projects */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <span className="text-violet-400">📁</span> Top Projects
                </h2>
                <div className="space-y-3">
                  {review.topProjects.map((project) => (
                    <div key={project.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{project.name}</span>
                        <span className="text-xs text-zinc-500">
                          {project.completedCount} / {project.totalCount}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-violet-500"
                          style={{
                            width: `${project.totalCount > 0 ? (project.completedCount / project.totalCount) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {review.topProjects.length === 0 && (
                    <p className="text-sm text-zinc-500">No project activity this week</p>
                  )}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 lg:col-span-2">
                <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <span className="text-amber-400">⏰</span> Upcoming Deadlines
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {review.upcomingDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                    >
                      <span className="text-sm text-zinc-300">{task.title}</span>
                      <span className="text-xs text-amber-400">
                        {dayjs(task.dueAt).format("MMM D")}
                      </span>
                    </div>
                  ))}
                  {review.upcomingDeadlines.length === 0 && (
                    <p className="text-sm text-zinc-500">No upcoming deadlines</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "violet" | "red";
}) {
  const colorClasses = {
    green: "from-green-500/20 to-green-500/5 text-green-400",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-400",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
    red: "from-red-500/20 to-red-500/5 text-red-400"
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} p-5`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
