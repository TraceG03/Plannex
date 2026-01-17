import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

interface WeeklyReviewDto {
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

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async getWeeklyReview(
    userId: string,
    workspaceId: string,
    weekStart: string
  ): Promise<WeeklyReviewDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const startDate = new Date(weekStart + "T00:00:00.000Z");
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Get completed tasks this week
    const completedTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        status: "done",
        updatedAt: { gte: startDate, lte: endDate }
      },
      include: { project: { select: { name: true } } },
      orderBy: { updatedAt: "desc" }
    });

    // Get tasks in progress
    const inProgressCount = await this.prisma.task.count({
      where: { workspaceId, status: "in_progress" }
    });

    // Get tasks created this week
    const createdCount = await this.prisma.task.count({
      where: {
        workspaceId,
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    // Get overdue tasks
    const overdueCount = await this.prisma.task.count({
      where: {
        workspaceId,
        status: { in: ["todo", "in_progress"] },
        dueAt: { lt: new Date() }
      }
    });

    // Get project stats
    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "done", updatedAt: { gte: startDate, lte: endDate } },
          select: { id: true }
        }
      }
    });

    const topProjects = projects
      .map((p) => ({
        id: p.id,
        name: p.name,
        completedCount: p.tasks.length,
        totalCount: p._count.tasks
      }))
      .filter((p) => p.completedCount > 0)
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5);

    // Get upcoming deadlines (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        status: { in: ["todo", "in_progress"] },
        dueAt: { gte: new Date(), lte: nextWeek }
      },
      orderBy: { dueAt: "asc" },
      take: 10
    });

    return {
      weekStart,
      weekEnd: endDate.toISOString().slice(0, 10),
      summary: {
        completed: completedTasks.length,
        inProgress: inProgressCount,
        created: createdCount,
        overdue: overdueCount
      },
      completedTasks: completedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        completedAt: t.updatedAt.toISOString(),
        projectName: t.project?.name ?? null
      })),
      topProjects,
      upcomingDeadlines: upcomingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt!.toISOString(),
        priority: t.priority
      }))
    };
  }
}
