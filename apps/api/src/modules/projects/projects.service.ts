import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
  startAt?: string;
  endAt?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string | null;
  color?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

interface ProjectDto {
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

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async list(userId: string, workspaceId: string): Promise<ProjectDto[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" }, select: { id: true } }
      }
    });

    return projects.map((p) => ({
      id: p.id,
      workspaceId: p.workspaceId,
      name: p.name,
      description: p.description,
      color: p.color,
      startAt: p.startAt?.toISOString() ?? null,
      endAt: p.endAt?.toISOString() ?? null,
      taskCount: p._count.tasks,
      completedCount: p.tasks.length,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString()
    }));
  }

  async getById(userId: string, workspaceId: string, projectId: string): Promise<ProjectDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" }, select: { id: true } }
      }
    });
    if (!project) throw new NotFoundException("Project not found");

    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      color: project.color,
      startAt: project.startAt?.toISOString() ?? null,
      endAt: project.endAt?.toISOString() ?? null,
      taskCount: project._count.tasks,
      completedCount: project.tasks.length,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  async create(userId: string, workspaceId: string, data: CreateProjectDto): Promise<ProjectDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.project.findUnique({
      where: { workspaceId_name: { workspaceId, name: data.name } }
    });
    if (existing) throw new ConflictException("Project name already exists");

    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        startAt: data.startAt ? new Date(data.startAt) : null,
        endAt: data.endAt ? new Date(data.endAt) : null
      }
    });

    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      color: project.color,
      startAt: project.startAt?.toISOString() ?? null,
      endAt: project.endAt?.toISOString() ?? null,
      taskCount: 0,
      completedCount: 0,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    };
  }

  async update(
    userId: string,
    workspaceId: string,
    projectId: string,
    data: UpdateProjectDto
  ): Promise<ProjectDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId }
    });
    if (!project) throw new NotFoundException("Project not found");

    if (data.name && data.name !== project.name) {
      const existing = await this.prisma.project.findUnique({
        where: { workspaceId_name: { workspaceId, name: data.name } }
      });
      if (existing) throw new ConflictException("Project name already exists");
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        startAt: data.startAt !== undefined ? (data.startAt ? new Date(data.startAt) : null) : undefined,
        endAt: data.endAt !== undefined ? (data.endAt ? new Date(data.endAt) : null) : undefined
      },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" }, select: { id: true } }
      }
    });

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      startAt: updated.startAt?.toISOString() ?? null,
      endAt: updated.endAt?.toISOString() ?? null,
      taskCount: updated._count.tasks,
      completedCount: updated.tasks.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  }

  async delete(userId: string, workspaceId: string, projectId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId }
    });
    if (!project) throw new NotFoundException("Project not found");

    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }
}
