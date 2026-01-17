"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useWorkspace } from "@/lib/workspace-context";
import api, { type PlanDayResponse, type SummarizeWeekResponse } from "@/lib/api";

export default function AIPage() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const wsId = currentWorkspace?.id ?? "";

  const [activeTab, setActiveTab] = useState<"plan" | "summarize">("plan");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
        <p className="text-sm text-zinc-400">Get AI-powered help with planning and reviews</p>
      </header>

      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "plan"
              ? "border-b-2 border-violet-500 text-violet-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📅 Plan My Day
        </button>
        <button
          onClick={() => setActiveTab("summarize")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "summarize"
              ? "border-b-2 border-violet-500 text-violet-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          📊 Summarize Week
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "plan" ? (
          <PlanMyDay wsId={wsId} queryClient={queryClient} />
        ) : (
          <SummarizeWeek wsId={wsId} />
        )}
      </div>
    </div>
  );
}

function PlanMyDay({ wsId, queryClient }: { wsId: string; queryClient: ReturnType<typeof useQueryClient> }) {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [goals, setGoals] = useState("");
  const [workdayStart, setWorkdayStart] = useState("09:00");
  const [workdayEnd, setWorkdayEnd] = useState("17:00");
  const [result, setResult] = useState<PlanDayResponse | null>(null);

  const planMutation = useMutation({
    mutationFn: () =>
      api.ai.planDay({
        workspaceId: wsId,
        date,
        goals: goals.split("\n").filter((g) => g.trim()),
        constraints: { workdayStart, workdayEnd }
      }),
    onSuccess: (data) => setResult(data)
  });

  const applyPlanMutation = useMutation({
    mutationFn: async () => {
      if (!result) return;
      const blocks = result.blocks.map((b) => ({
        startMin: timeToMinutes(b.start),
        endMin: timeToMinutes(b.end),
        title: b.title,
        relatedTaskId: b.relatedTaskId ?? null
      }));
      return api.timeBlocks.batchCreate(wsId, date, blocks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeBlocks", wsId] });
      alert("Plan applied to your today view!");
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 font-semibold text-white">Plan Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Goals for the day (one per line)
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
              placeholder="Finish the homepage design&#10;Review open PRs&#10;..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Work starts</label>
              <input
                type="time"
                value={workdayStart}
                onChange={(e) => setWorkdayStart(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Work ends</label>
              <input
                type="time"
                value={workdayEnd}
                onChange={(e) => setWorkdayEnd(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
              />
            </div>
          </div>

          <button
            onClick={() => planMutation.mutate()}
            disabled={planMutation.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {planMutation.isPending ? "Generating..." : "✨ Generate Plan"}
          </button>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 font-semibold text-white">Generated Schedule</h2>

        {result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {result.blocks.map((block, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3"
                >
                  <div className="text-sm text-zinc-400">
                    {block.start} - {block.end}
                  </div>
                  <div className="text-sm text-white">{block.title}</div>
                </div>
              ))}
            </div>

            {result.notes.length > 0 && (
              <div className="rounded-lg bg-amber-500/10 p-4">
                <h3 className="mb-2 text-sm font-medium text-amber-400">Notes</h3>
                <ul className="space-y-1 text-sm text-amber-200">
                  {result.notes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => applyPlanMutation.mutate()}
              disabled={applyPlanMutation.isPending}
              className="w-full rounded-lg border border-violet-500 py-2.5 font-medium text-violet-400 hover:bg-violet-500/10 disabled:opacity-50"
            >
              {applyPlanMutation.isPending ? "Applying..." : "Apply to Today View"}
            </button>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-zinc-500">
            Generate a plan to see results
          </div>
        )}
      </div>
    </div>
  );
}

function SummarizeWeek({ wsId }: { wsId: string }) {
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.startOf("week").add(1, "day").format("YYYY-MM-DD");
  });
  const [result, setResult] = useState<SummarizeWeekResponse | null>(null);

  const summarizeMutation = useMutation({
    mutationFn: () => api.ai.summarizeWeek({ workspaceId: wsId, weekStart }),
    onSuccess: (data) => setResult(data)
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 font-semibold text-white">Week Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Week starting (Monday)
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-white"
            />
          </div>

          <button
            onClick={() => summarizeMutation.mutate()}
            disabled={summarizeMutation.isPending}
            className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {summarizeMutation.isPending ? "Analyzing..." : "📊 Summarize Week"}
          </button>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 font-semibold text-white">Week Summary</h2>

        {result ? (
          <div className="space-y-4">
            <Section title="🎯 Highlights" items={result.highlights} color="violet" />
            <Section title="🎉 Wins" items={result.wins} color="green" />
            {result.risks.length > 0 && (
              <Section title="⚠️ Risks" items={result.risks} color="red" />
            )}
            <Section title="👉 Next Week Focus" items={result.nextWeekFocus} color="blue" />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-zinc-500">
            Generate a summary to see results
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  color
}: {
  title: string;
  items: string[];
  color: "violet" | "green" | "red" | "blue";
}) {
  const colorClasses = {
    violet: "bg-violet-500/10 text-violet-300",
    green: "bg-green-500/10 text-green-300",
    red: "bg-red-500/10 text-red-300",
    blue: "bg-blue-500/10 text-blue-300"
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <h3 className="mb-2 font-medium">{title}</h3>
      <ul className="space-y-1 text-sm">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
