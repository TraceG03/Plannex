import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { TasksService } from "../tasks/tasks.service";
import { z } from "zod";

const TemplateTaskSchema = z.object({
  title: z.string().min(1).max(240),
  descriptionMd: z.string().max(50_000).nullable().optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
  color: z.string().max(32).nullable().optional()
});

const TemplateDataSchema = z.object({
  tasks: z.array(TemplateTaskSchema)
});

type TemplateData = z.infer<typeof TemplateDataSchema>;

interface CreateTemplateDto {
  name: string;
  description?: string;
  data: TemplateData;
}

interface TemplateDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  data: TemplateData;
  createdById: string;
  createdAt: string;
}

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService,
    private tasks: TasksService
  ) {}

  async list(userId: string, workspaceId: string): Promise<TemplateDto[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const templates = await this.prisma.template.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } }
    });

    return templates.map((t) => ({
      id: t.id,
      workspaceId: t.workspaceId,
      name: t.name,
      description: t.description,
      data: TemplateDataSchema.parse(t.data),
      createdById: t.createdById,
      createdAt: t.createdAt.toISOString()
    }));
  }

  async getById(userId: string, workspaceId: string, templateId: string): Promise<TemplateDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const template = await this.prisma.template.findFirst({
      where: { id: templateId, workspaceId }
    });
    if (!template) throw new NotFoundException("Template not found");

    return {
      id: template.id,
      workspaceId: template.workspaceId,
      name: template.name,
      description: template.description,
      data: TemplateDataSchema.parse(template.data),
      createdById: template.createdById,
      createdAt: template.createdAt.toISOString()
    };
  }

  async create(userId: string, workspaceId: string, data: CreateTemplateDto): Promise<TemplateDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const validatedData = TemplateDataSchema.parse(data.data);

    const template = await this.prisma.template.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description ?? null,
        data: validatedData,
        createdById: userId
      }
    });

    return {
      id: template.id,
      workspaceId: template.workspaceId,
      name: template.name,
      description: template.description,
      data: validatedData,
      createdById: template.createdById,
      createdAt: template.createdAt.toISOString()
    };
  }

  async delete(userId: string, workspaceId: string, templateId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const template = await this.prisma.template.findFirst({
      where: { id: templateId, workspaceId }
    });
    if (!template) throw new NotFoundException("Template not found");

    await this.prisma.template.delete({ where: { id: templateId } });
    return { success: true };
  }

  async apply(
    userId: string,
    workspaceId: string,
    templateId: string,
    options?: { projectId?: string; channelId?: string }
  ) {
    await this.workspaces.assertMember(userId, workspaceId);

    const template = await this.prisma.template.findFirst({
      where: { id: templateId, workspaceId }
    });
    if (!template) throw new NotFoundException("Template not found");

    const data = TemplateDataSchema.parse(template.data);

    const createdTasks = await Promise.all(
      data.tasks.map((taskData) =>
        this.tasks.create(userId, {
          workspaceId,
          title: taskData.title,
          descriptionMd: taskData.descriptionMd ?? null,
          priority: taskData.priority ?? "medium",
          color: taskData.color ?? null,
          projectId: options?.projectId ?? null,
          channelId: options?.channelId ?? null,
          tagIds: []
        })
      )
    );

    return {
      templateId,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    };
  }
}
