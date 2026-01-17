import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

interface CreateTagDto {
  name: string;
  color?: string;
}

interface UpdateTagDto {
  name?: string;
  color?: string | null;
}

@Injectable()
export class TagsService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async list(userId: string, workspaceId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const tags = await this.prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: { _count: { select: { taskTags: true } } }
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      taskCount: t._count.taskTags,
      createdAt: t.createdAt.toISOString()
    }));
  }

  async create(userId: string, workspaceId: string, data: CreateTagDto) {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.tag.findUnique({
      where: { workspaceId_name: { workspaceId, name: data.name } }
    });
    if (existing) throw new ConflictException("Tag already exists");

    const tag = await this.prisma.tag.create({
      data: {
        workspaceId,
        name: data.name,
        color: data.color ?? null
      }
    });

    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      taskCount: 0,
      createdAt: tag.createdAt.toISOString()
    };
  }

  async update(userId: string, workspaceId: string, tagId: string, data: UpdateTagDto) {
    await this.workspaces.assertMember(userId, workspaceId);

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId }
    });
    if (!tag) throw new NotFoundException("Tag not found");

    if (data.name && data.name !== tag.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { workspaceId_name: { workspaceId, name: data.name } }
      });
      if (existing) throw new ConflictException("Tag name already exists");
    }

    const updated = await this.prisma.tag.update({
      where: { id: tagId },
      data: { name: data.name, color: data.color }
    });

    return {
      id: updated.id,
      name: updated.name,
      color: updated.color
    };
  }

  async delete(userId: string, workspaceId: string, tagId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, workspaceId }
    });
    if (!tag) throw new NotFoundException("Tag not found");

    await this.prisma.tag.delete({ where: { id: tagId } });
    return { success: true };
  }
}
