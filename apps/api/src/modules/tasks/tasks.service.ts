import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { CreateTask, UpdateTask, Task, TaskStatus, Priority } from "@planner/shared";
import { Prisma } from "@prisma/client";

interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  projectId?: string;
  channelId?: string;
  tagIds?: string[];
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async list(userId: string, workspaceId: string, filters: TaskFilters) {
    await this.workspaces.assertMember(userId, workspaceId);

    const where: Prisma.TaskWhereInput = { workspaceId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.channelId) where.channelId = filters.channelId;
    if (filters.tagIds?.length) {
      where.tags = { some: { tagId: { in: filters.tagIds } } };
    }
    if (filters.dueBefore || filters.dueAfter) {
      where.dueAt = {};
      if (filters.dueBefore) where.dueAt.lte = new Date(filters.dueBefore);
      if (filters.dueAfter) where.dueAt.gte = new Date(filters.dueAfter);
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { descriptionMd: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const limit = filters.limit ?? 50;
    const tasks = await this.prisma.task.findMany({
      where,
      take: limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      skip: filters.cursor ? 1 : 0,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      include: { tags: { select: { tagId: true } } }
    });

    const hasMore = tasks.length > limit;
    const items = hasMore ? tasks.slice(0, -1) : tasks;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items: items.map(this.toTaskDto),
      nextCursor
    };
  }

  async getById(userId: string, workspaceId: string, taskId: string): Promise<Task> {
    await this.workspaces.assertMember(userId, workspaceId);
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      include: { tags: { select: { tagId: true } } }
    });
    if (!task) throw new NotFoundException("Task not found");
    return this.toTaskDto(task);
  }

  async create(userId: string, data: CreateTask): Promise<Task> {
    await this.workspaces.assertMember(userId, data.workspaceId);

    const task = await this.prisma.task.create({
      data: {
        workspaceId: data.workspaceId,
        projectId: data.projectId ?? null,
        channelId: data.channelId ?? null,
        title: data.title,
        descriptionMd: data.descriptionMd ?? null,
        status: data.status ?? "todo",
        priority: data.priority ?? "medium",
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        color: data.color ?? null,
        createdById: userId,
        assigneeId: data.assigneeId ?? null,
        tags: data.tagIds?.length
          ? { create: data.tagIds.map((tagId) => ({ tagId })) }
          : undefined
      },
      include: { tags: { select: { tagId: true } } }
    });

    return this.toTaskDto(task);
  }

  async update(userId: string, workspaceId: string, data: UpdateTask): Promise<Task> {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.task.findFirst({
      where: { id: data.id, workspaceId }
    });
    if (!existing) throw new NotFoundException("Task not found");

    // Handle tag updates if provided
    if (data.tagIds !== undefined) {
      await this.prisma.taskTag.deleteMany({ where: { taskId: data.id } });
      if (data.tagIds.length > 0) {
        await this.prisma.taskTag.createMany({
          data: data.tagIds.map((tagId) => ({ taskId: data.id, tagId }))
        });
      }
    }

    const task = await this.prisma.task.update({
      where: { id: data.id },
      data: {
        title: data.title,
        descriptionMd: data.descriptionMd,
        status: data.status,
        priority: data.priority,
        dueAt: data.dueAt !== undefined ? (data.dueAt ? new Date(data.dueAt) : null) : undefined,
        color: data.color,
        projectId: data.projectId,
        channelId: data.channelId,
        assigneeId: data.assigneeId
      },
      include: { tags: { select: { tagId: true } } }
    });

    return this.toTaskDto(task);
  }

  async delete(userId: string, workspaceId: string, taskId: string) {
    await this.workspaces.assertMember(userId, workspaceId);
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId }
    });
    if (!task) throw new NotFoundException("Task not found");

    await this.prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }

  async getTasksForDate(
    userId: string,
    workspaceId: string,
    date: string
  ): Promise<Task[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const startOfDay = new Date(date + "T00:00:00.000Z");
    const endOfDay = new Date(date + "T23:59:59.999Z");

    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        OR: [
          { assigneeId: userId },
          { createdById: userId }
        ],
        dueAt: { gte: startOfDay, lte: endOfDay }
      },
      include: { tags: { select: { tagId: true } } },
      orderBy: { dueAt: "asc" }
    });

    return tasks.map(this.toTaskDto);
  }

  async getCompletedTasksInRange(
    userId: string,
    workspaceId: string,
    startDate: string,
    endDate: string
  ): Promise<Task[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T23:59:59.999Z");

    const tasks = await this.prisma.task.findMany({
      where: {
        workspaceId,
        status: "done",
        updatedAt: { gte: start, lte: end }
      },
      include: { tags: { select: { tagId: true } } },
      orderBy: { updatedAt: "desc" }
    });

    return tasks.map(this.toTaskDto);
  }

  private toTaskDto(
    task: {
      id: string;
      workspaceId: string;
      projectId: string | null;
      channelId: string | null;
      title: string;
      descriptionMd: string | null;
      status: string;
      priority: string;
      dueAt: Date | null;
      color: string | null;
      createdById: string;
      assigneeId: string | null;
      createdAt: Date;
      updatedAt: Date;
      tags?: { tagId: string }[];
    }
  ): Task {
    return {
      id: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      channelId: task.channelId,
      title: task.title,
      descriptionMd: task.descriptionMd,
      status: task.status as TaskStatus,
      priority: task.priority as Priority,
      dueAt: task.dueAt?.toISOString() ?? null,
      color: task.color,
      createdById: task.createdById,
      assigneeId: task.assigneeId,
      tagIds: task.tags?.map((t) => t.tagId) ?? [],
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };
  }
}
