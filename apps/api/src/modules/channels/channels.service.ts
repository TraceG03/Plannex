import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

interface CreateChannelDto {
  name: string;
  description?: string;
  notesMd?: string;
}

interface UpdateChannelDto {
  name?: string;
  description?: string | null;
  notesMd?: string | null;
}

interface ChannelDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  notesMd: string | null;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async list(userId: string, workspaceId: string): Promise<ChannelDto[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const channels = await this.prisma.channel.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: { _count: { select: { tasks: true } } }
    });

    return channels.map((c) => ({
      id: c.id,
      workspaceId: c.workspaceId,
      name: c.name,
      description: c.description,
      notesMd: c.notesMd,
      taskCount: c._count.tasks,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString()
    }));
  }

  async getById(userId: string, workspaceId: string, channelId: string): Promise<ChannelDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, workspaceId },
      include: { _count: { select: { tasks: true } } }
    });
    if (!channel) throw new NotFoundException("Channel not found");

    return {
      id: channel.id,
      workspaceId: channel.workspaceId,
      name: channel.name,
      description: channel.description,
      notesMd: channel.notesMd,
      taskCount: channel._count.tasks,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString()
    };
  }

  async create(userId: string, workspaceId: string, data: CreateChannelDto): Promise<ChannelDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.channel.findUnique({
      where: { workspaceId_name: { workspaceId, name: data.name } }
    });
    if (existing) throw new ConflictException("Channel name already exists");

    const channel = await this.prisma.channel.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description ?? null,
        notesMd: data.notesMd ?? null
      }
    });

    return {
      id: channel.id,
      workspaceId: channel.workspaceId,
      name: channel.name,
      description: channel.description,
      notesMd: channel.notesMd,
      taskCount: 0,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString()
    };
  }

  async update(
    userId: string,
    workspaceId: string,
    channelId: string,
    data: UpdateChannelDto
  ): Promise<ChannelDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, workspaceId }
    });
    if (!channel) throw new NotFoundException("Channel not found");

    if (data.name && data.name !== channel.name) {
      const existing = await this.prisma.channel.findUnique({
        where: { workspaceId_name: { workspaceId, name: data.name } }
      });
      if (existing) throw new ConflictException("Channel name already exists");
    }

    const updated = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        name: data.name,
        description: data.description,
        notesMd: data.notesMd
      },
      include: { _count: { select: { tasks: true } } }
    });

    return {
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      description: updated.description,
      notesMd: updated.notesMd,
      taskCount: updated._count.tasks,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };
  }

  async delete(userId: string, workspaceId: string, channelId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, workspaceId }
    });
    if (!channel) throw new NotFoundException("Channel not found");

    await this.prisma.channel.delete({ where: { id: channelId } });
    return { success: true };
  }
}
