import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { TasksService } from "../tasks/tasks.service";
import { EventsService } from "../events/events.service";
import {
  PlanMyDayRequest,
  PlanMyDayResponse,
  PlanMyDayResponseSchema,
  SummarizeWeekRequest,
  SummarizeWeekResponse,
  SummarizeWeekResponseSchema
} from "@planner/shared";

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;

  constructor(
    private config: ConfigService,
    private tasks: TasksService,
    private events: EventsService
  ) {
    const enabled = this.config.get<string>("OPENAI_ENABLED") === "true";
    const apiKey = this.config.get<string>("OPENAI_API_KEY");

    if (enabled && apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async planDay(userId: string, request: PlanMyDayRequest): Promise<PlanMyDayResponse> {
    const date = request.date ?? new Date().toISOString().slice(0, 10);

    // Get user's tasks for the day
    const userTasks = await this.tasks.getTasksForDate(userId, request.workspaceId, date);
    const dayEvents = await this.events.getEventsForDate(userId, request.workspaceId, date);

    if (!this.openai) {
      // Fallback: simple non-AI scheduling
      return this.simplePlanDay(date, userTasks, dayEvents, request);
    }

    const model = this.config.get<string>("OPENAI_MODEL") ?? "gpt-4.1-mini";

    const prompt = `You are a productivity assistant helping plan a workday.

Today is ${date}.
Work hours: ${request.constraints?.workdayStart ?? "09:00"} to ${request.constraints?.workdayEnd ?? "17:00"}
Preferred focus block lengths: ${(request.constraints?.focusBlocksMinutes ?? [50]).join(", ")} minutes

User's goals for today:
${request.goals.length ? request.goals.map((g) => `- ${g}`).join("\n") : "No specific goals provided"}

Tasks due today or overdue:
${userTasks.length ? userTasks.map((t) => `- ${t.title} (priority: ${t.priority}, due: ${t.dueAt ?? "no due date"})`).join("\n") : "No tasks"}

Calendar events:
${dayEvents.length ? dayEvents.map((e) => `- ${e.title}: ${e.startAt.slice(11, 16)} - ${e.endAt.slice(11, 16)}`).join("\n") : "No events"}

Create an optimized daily schedule with time blocks. Include breaks. Prioritize urgent tasks first, then by due date. For each block, if it relates to a task, include the task title so I can match it.`;

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: zodResponseFormat(PlanMyDayResponseSchema, "plan_day")
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new BadRequestException("AI did not return a response");
    }

    const parsed = PlanMyDayResponseSchema.parse(JSON.parse(content));

    // Match blocks to tasks by title
    const blocksWithTaskIds = parsed.blocks.map((block) => {
      const matchedTask = userTasks.find(
        (t) => block.title.toLowerCase().includes(t.title.toLowerCase().slice(0, 20))
      );
      return {
        ...block,
        relatedTaskId: matchedTask?.id ?? null
      };
    });

    return {
      date,
      blocks: blocksWithTaskIds,
      notes: parsed.notes
    };
  }

  async summarizeWeek(userId: string, request: SummarizeWeekRequest): Promise<SummarizeWeekResponse> {
    const weekStart = new Date(request.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const completedTasks = await this.tasks.getCompletedTasksInRange(
      userId,
      request.workspaceId,
      request.weekStart,
      weekEnd.toISOString().slice(0, 10)
    );

    if (!this.openai) {
      // Fallback: simple non-AI summary
      return this.simpleSummarizeWeek(request.weekStart, completedTasks);
    }

    const model = this.config.get<string>("OPENAI_MODEL") ?? "gpt-4.1-mini";

    const prompt = `You are a productivity assistant helping with a weekly review.

Week of ${request.weekStart} to ${weekEnd.toISOString().slice(0, 10)}

Completed tasks this week:
${completedTasks.length ? completedTasks.map((t) => `- ${t.title} (priority: ${t.priority})`).join("\n") : "No tasks completed"}

Provide:
1. 2-3 highlights/key accomplishments
2. 2-3 wins to celebrate
3. Any risks or concerns based on what was done
4. 2-3 suggested focus areas for next week`;

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: zodResponseFormat(SummarizeWeekResponseSchema, "summarize_week")
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new BadRequestException("AI did not return a response");
    }

    return SummarizeWeekResponseSchema.parse(JSON.parse(content));
  }

  private simplePlanDay(
    date: string,
    tasks: { id: string; title: string; priority: string }[],
    events: { title: string; startAt: string; endAt: string }[],
    request: PlanMyDayRequest
  ): PlanMyDayResponse {
    const workStart = request.constraints?.workdayStart ?? "09:00";
    const workEnd = request.constraints?.workdayEnd ?? "17:00";
    const blockLen = request.constraints?.focusBlocksMinutes?.[0] ?? 50;

    const blocks: PlanMyDayResponse["blocks"] = [];

    // Add planning block
    blocks.push({
      start: workStart,
      end: this.addMinutes(workStart, 30),
      title: "Morning planning"
    });

    let currentTime = this.addMinutes(workStart, 30);

    // Sort tasks by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortedTasks = [...tasks].sort(
      (a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) -
                (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2)
    );

    // Add task blocks
    for (const task of sortedTasks.slice(0, 4)) {
      if (this.timeToMinutes(currentTime) + blockLen > this.timeToMinutes(workEnd)) break;

      blocks.push({
        start: currentTime,
        end: this.addMinutes(currentTime, blockLen),
        title: `Work on: ${task.title}`,
        relatedTaskId: task.id
      });

      // Add break
      currentTime = this.addMinutes(currentTime, blockLen);
      if (this.timeToMinutes(currentTime) + 10 < this.timeToMinutes(workEnd)) {
        blocks.push({
          start: currentTime,
          end: this.addMinutes(currentTime, 10),
          title: "Break"
        });
        currentTime = this.addMinutes(currentTime, 10);
      }
    }

    return {
      date,
      blocks,
      notes: ["This is a simple auto-generated plan. Enable AI for smarter scheduling."]
    };
  }

  private simpleSummarizeWeek(
    weekStart: string,
    completedTasks: { title: string; priority: string }[]
  ): SummarizeWeekResponse {
    const urgentCount = completedTasks.filter((t) => t.priority === "urgent").length;
    const highCount = completedTasks.filter((t) => t.priority === "high").length;

    return {
      weekStart,
      highlights: [
        `Completed ${completedTasks.length} tasks this week`,
        urgentCount > 0 ? `Handled ${urgentCount} urgent items` : "No urgent items this week"
      ],
      wins: completedTasks.slice(0, 3).map((t) => `Completed: ${t.title}`),
      risks: completedTasks.length === 0 ? ["No tasks were completed this week"] : [],
      nextWeekFocus: ["Review remaining tasks", "Set clear priorities"]
    };
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private addMinutes(time: string, minutes: number): string {
    const total = this.timeToMinutes(time) + minutes;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
}
