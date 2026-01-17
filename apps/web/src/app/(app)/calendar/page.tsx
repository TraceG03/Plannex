"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useWorkspace } from "@/lib/workspace-context";
import api, { type CalendarEvent, type CreateEvent } from "@/lib/api";

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const wsId = currentWorkspace?.id ?? "";

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const rangeStart = viewMode === "month"
    ? currentDate.startOf("month").startOf("week")
    : currentDate.startOf("week");
  const rangeEnd = viewMode === "month"
    ? currentDate.endOf("month").endOf("week")
    : currentDate.endOf("week");

  const { data: events = [] } = useQuery({
    queryKey: ["events", wsId, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: () =>
      api.events.list(wsId, {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString()
      }),
    enabled: !!wsId
  });

  const createEventMutation = useMutation({
    mutationFn: (data: CreateEvent) => api.events.create(wsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", wsId] });
      setShowNewEvent(false);
    }
  });

  const days = useMemo(() => {
    const result = [];
    let day = rangeStart;
    while (day.isBefore(rangeEnd) || day.isSame(rangeEnd, "day")) {
      result.push(day);
      day = day.add(1, "day");
    }
    return result;
  }, [rangeStart, rangeEnd]);

  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const getEventsForDay = (day: dayjs.Dayjs) => {
    return events.filter((e) => {
      const start = dayjs(e.startAt);
      return start.format("YYYY-MM-DD") === day.format("YYYY-MM-DD");
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            {currentDate.format("MMMM YYYY")}
          </h1>
          <div className="flex items-center">
            <button
              onClick={() => setCurrentDate(currentDate.subtract(1, viewMode))}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(dayjs())}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(currentDate.add(1, viewMode))}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-zinc-700 p-1">
            <button
              onClick={() => setViewMode("week")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === "week" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === "month" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Month
            </button>
          </div>

          <button
            onClick={() => setShowNewEvent(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <PlusIcon className="h-4 w-4" />
            New Event
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-6">
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-zinc-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, wi) =>
            week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day.isSame(dayjs(), "day");
              const isCurrentMonth = day.month() === currentDate.month();

              return (
                <div
                  key={day.toString()}
                  onClick={() => {
                    setSelectedDate(day.format("YYYY-MM-DD"));
                    setShowNewEvent(true);
                  }}
                  className={`min-h-[100px] cursor-pointer rounded-lg border p-2 transition-colors hover:border-zinc-600 ${
                    isCurrentMonth ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-800/50 bg-zinc-900/20"
                  }`}
                >
                  <div
                    className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isToday
                        ? "bg-violet-600 font-bold text-white"
                        : isCurrentMonth
                          ? "text-zinc-300"
                          : "text-zinc-600"
                    }`}
                  >
                    {day.date()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="truncate rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300"
                        title={event.title}
                      >
                        {dayjs(event.startAt).format("HH:mm")} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-zinc-500">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Event Modal */}
      {showNewEvent && (
        <NewEventModal
          defaultDate={selectedDate}
          onClose={() => {
            setShowNewEvent(false);
            setSelectedDate(null);
          }}
          onCreate={(data) => createEventMutation.mutate(data)}
          isLoading={createEventMutation.isPending}
        />
      )}
    </div>
  );
}

function NewEventModal({
  defaultDate,
  onClose,
  onCreate,
  isLoading
}: {
  defaultDate: string | null;
  onClose: () => void;
  onCreate: (data: CreateEvent) => void;
  isLoading: boolean;
}) {
  const today = defaultDate ?? dayjs().format("YYYY-MM-DD");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      startAt: allDay ? `${startDate}T00:00:00Z` : `${startDate}T${startTime}:00Z`,
      endAt: allDay ? `${endDate}T23:59:59Z` : `${endDate}T${endTime}:00Z`,
      allDay
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl animate-slide-up">
        <h2 className="mb-4 text-lg font-semibold text-white">New Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white focus:border-violet-500 focus:outline-none"
              placeholder="Event title"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800"
            />
            <label htmlFor="allDay" className="text-sm text-zinc-300">
              All day event
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
                />
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
                />
              )}
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
              {isLoading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
