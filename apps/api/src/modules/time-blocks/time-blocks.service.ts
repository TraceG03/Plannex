import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

interface CreateTimeBlockDto {
  date: string; // YYYY-MM-DD
  startMin: number;
  endMin: number;
  title: string;
  relatedTaskId?: string | null;
}

interface UpdateTimeBlockDto {
  startMin?: number;
  endMin?: number;
  title?: string;
  relatedTaskId?: string | null;
}

interface TimeBlockDto {
  id: string;
  workspaceId: string;
  userId: string;
  date: string;
  startMin: number;
  endMin: number;
  title: string;
  relatedTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TimeBlocksService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async listForDate(
    userId: string,
    workspaceId: string,
    date: string,
    targetUserId?: string
  ): Promise<TimeBlockDto[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const dateUtc = new Date(date + "T00:00:00.000Z");

    const blocks = await this.prisma.timeBlock.findMany({
      where: {
        workspaceId,
        userId: targetUserId ?? userId,
        date: dateUtc
      },
      orderBy: { startMin: "asc" }
    });

    return blocks.map(this.toDto);
  }

  async create(
    userId: string,
    workspaceId: string,
    data: CreateTimeBlockDto
  ): Promise<TimeBlockDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const dateUtc = new Date(data.date + "T00:00:00.000Z");

    const block = await this.prisma.timeBlock.create({
      data: {
        workspaceId,
        userId,
        date: dateUtc,
        startMin: data.startMin,
        endMin: data.endMin,
        title: data.title,
        relatedTaskId: data.relatedTaskId ?? null
      }
    });

    return this.toDto(block);
  }

  async update(
    userId: string,
    workspaceId: string,
    blockId: string,
    data: UpdateTimeBlockDto
  ): Promise<TimeBlockDto> {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.timeBlock.findFirst({
      where: { id: blockId, workspaceId, userId }
    });
    if (!existing) throw new NotFoundException("Time block not found");

    const block = await this.prisma.timeBlock.update({
      where: { id: blockId },
      data: {
        startMin: data.startMin,
        endMin: data.endMin,
        title: data.title,
        relatedTaskId: data.relatedTaskId
      }
    });

    return this.toDto(block);
  }

  async delete(userId: string, workspaceId: string, blockId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.timeBlock.findFirst({
      where: { id: blockId, workspaceId, userId }
    });
    if (!existing) throw new NotFoundException("Time block not found");

    await this.prisma.timeBlock.delete({ where: { id: blockId } });
    return { success: true };
  }

  async createBatch(
    userId: string,
    workspaceId: string,
    date: string,
    blocks: Omit<CreateTimeBlockDto, "date">[]
  ): Promise<TimeBlockDto[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const dateUtc = new Date(date + "T00:00:00.000Z");

    // Delete existing blocks for this day
    await this.prisma.timeBlock.deleteMany({
      where: { workspaceId, userId, date: dateUtc }
    });

    // Create new blocks
    const created = await Promise.all(
      blocks.map((b) =>
        this.prisma.timeBlock.create({
          data: {
            workspaceId,
            userId,
            date: dateUtc,
            startMin: b.startMin,
            endMin: b.endMin,
            title: b.title,
            relatedTaskId: b.relatedTaskId ?? null
          }
        })
      )
    );

    return created.map(this.toDto);
  }

  private toDto(block: {
    id: string;
    workspaceId: string;
    userId: string;
    date: Date;
    startMin: number;
    endMin: number;
    title: string;
    relatedTaskId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TimeBlockDto {
    return {
      id: block.id,
      workspaceId: block.workspaceId,
      userId: block.userId,
      date: block.date.toISOString().slice(0, 10),
      startMin: block.startMin,
      endMin: block.endMin,
      title: block.title,
      relatedTaskId: block.relatedTaskId,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString()
    };
  }
}
