"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useWorkspace } from "@/lib/workspace-context";
import api, { type Task, type TimeBlock, type CalendarEvent } from "@/lib/api";

export default function TodayPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  const wsId = currentWorkspace?.id ?? "";

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ["timeBlocks", wsId, selectedDate],
    queryFn: () => api.timeBlocks.list(wsId, selectedDate),
    enabled: !!wsId
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", wsId, { status: "todo,in_progress", limit: "20" }],
    queryFn: () => api.tasks.list(wsId, { status: "todo", limit: "20" }),
    enabled: !!wsId
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", wsId, selectedDate],
    queryFn: () => {
      const start = selectedDate + "T00:00:00Z";
      const end = selectedDate + "T23:59:59Z";
      return api.events.list(wsId, { start, end });
    },
    enabled: !!wsId
  });

  const tasks = tasksData?.items ?? [];

  const createBlockMutation = useMutation({
    mutationFn: (data: { date: string; startMin: number; endMin: number; title: string }) =>
      api.timeBlocks.create(wsId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timeBlocks", wsId] })
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.tasks.update(wsId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", wsId] })
  });

  const hours = useMemo(() => {
    const arr = [];
    for (let h = 6; h <= 22; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  const dateDisplay = dayjs(selectedDate).format("dddd, MMMM D");
  const isToday = selectedDate === dayjs().format("YYYY-MM-DD");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {isToday ? "Today" : dateDisplay}
          </h1>
          {isToday && <p className="text-sm text-zinc-400">{dateDisplay}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, "day").format("YYYY-MM-DD"))}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelectedDate(dayjs().format("YYYY-MM-DD"))}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD"))}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Time Blocks Column */}
        <div className="flex-1 overflow-y-auto border-r border-zinc-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-white">Time Blocks</h2>
            <button
              onClick={() => {
                const now = dayjs();
                const startMin = Math.floor(now.hour() * 60 + now.minute() / 15) * 15;
                createBlockMutation.mutate({
                  date: selectedDate,
                  startMin,
                  endMin: startMin + 60,
                  title: "New block"
                });
              }}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              <PlusIcon className="h-4 w-4" />
              Add Block
            </button>
          </div>

          <div className="relative">
            {/* Hour lines */}
            {hours.map((hour) => (
              <div key={hour} className="relative h-16 border-t border-zinc-800/50">
                <span className="absolute -top-2.5 left-0 text-xs text-zinc-500">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}

            {/* Time blocks overlay */}
            <div className="absolute inset-0 left-14">
              {timeBlocks.map((block) => {
                const top = ((block.startMin - 6 * 60) / 60) * 64;
                const height = ((block.endMin - block.startMin) / 60) * 64;
                return (
                  <div
                    key={block.id}
                    className="absolute left-0 right-4 rounded-lg bg-violet-500/20 border border-violet-500/30 px-3 py-2"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="font-medium text-violet-300 text-sm truncate">
                      {block.title}
                    </div>
                    <div className="text-xs text-violet-400">
                      {formatTime(block.startMin)} - {formatTime(block.endMin)}
                    </div>
                  </div>
                );
              })}

              {/* Events overlay */}
              {events.map((event) => {
                const startMin = dayjs(event.startAt).hour() * 60 + dayjs(event.startAt).minute();
                const endMin = dayjs(event.endAt).hour() * 60 + dayjs(event.endAt).minute();
                const top = ((startMin - 6 * 60) / 60) * 64;
                const height = Math.max(((endMin - startMin) / 60) * 64, 32);
                return (
                  <div
                    key={event.id}
                    className="absolute left-0 right-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-2"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="font-medium text-emerald-300 text-sm truncate">
                      📅 {event.title}
                    </div>
                    <div className="text-xs text-emerald-400">
                      {dayjs(event.startAt).format("HH:mm")} - {dayjs(event.endAt).format("HH:mm")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks Column */}
        <div className="w-96 flex-shrink-0 overflow-y-auto p-6">
          <h2 className="mb-4 font-medium text-white">Tasks</h2>

          {/* Due today */}
          <div className="mb-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Due Today
            </h3>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.dueAt && dayjs(t.dueAt).format("YYYY-MM-DD") === selectedDate)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() =>
                      updateTaskMutation.mutate({
                        id: task.id,
                        data: { status: task.status === "done" ? "todo" : "done" }
                      })
                    }
                  />
                ))}
              {tasks.filter((t) => t.dueAt && dayjs(t.dueAt).format("YYYY-MM-DD") === selectedDate).length === 0 && (
                <p className="text-sm text-zinc-500">No tasks due today</p>
              )}
            </div>
          </div>

          {/* Other tasks */}
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Other Tasks
            </h3>
            <div className="space-y-2">
              {tasks
                .filter((t) => !t.dueAt || dayjs(t.dueAt).format("YYYY-MM-DD") !== selectedDate)
                .slice(0, 10)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() =>
                      updateTaskMutation.mutate({
                        id: task.id,
                        data: { status: task.status === "done" ? "todo" : "done" }
                      })
                    }
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const priorityColors = {
    urgent: "border-red-500 bg-red-500/10",
    high: "border-orange-500 bg-orange-500/10",
    medium: "border-yellow-500 bg-yellow-500/10",
    low: "border-zinc-500 bg-zinc-500/10"
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        task.status === "done"
          ? "border-zinc-800 bg-zinc-900/50 opacity-60"
          : priorityColors[task.priority]
      }`}
    >
      <button
        onClick={onToggle}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
          task.status === "done"
            ? "border-green-500 bg-green-500 text-white"
            : "border-zinc-600 hover:border-zinc-500"
        }`}
      >
        {task.status === "done" && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${task.status === "done" ? "line-through text-zinc-500" : "text-white"}`}>
          {task.title}
        </div>
        {task.dueAt && (
          <div className="mt-1 text-xs text-zinc-500">
            Due: {dayjs(task.dueAt).format("MMM D, HH:mm")}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
