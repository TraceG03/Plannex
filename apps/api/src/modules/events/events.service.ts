import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { CreateEvent, Event } from "@planner/shared";

interface EventFilters {
  start?: string;
  end?: string;
}

interface UpdateEventDto {
  title?: string;
  descriptionMd?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  color?: string | null;
}

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async list(userId: string, workspaceId: string, filters: EventFilters) {
    await this.workspaces.assertMember(userId, workspaceId);

    const where: { workspaceId: string; startAt?: { gte?: Date; lte?: Date } } = {
      workspaceId
    };

    if (filters.start || filters.end) {
      where.startAt = {};
      if (filters.start) where.startAt.gte = new Date(filters.start);
      if (filters.end) where.startAt.lte = new Date(filters.end);
    }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { startAt: "asc" }
    });

    return events.map(this.toEventDto);
  }

  async getById(userId: string, workspaceId: string, eventId: string): Promise<Event> {
    await this.workspaces.assertMember(userId, workspaceId);

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, workspaceId }
    });
    if (!event) throw new NotFoundException("Event not found");

    return this.toEventDto(event);
  }

  async create(userId: string, data: CreateEvent): Promise<Event> {
    await this.workspaces.assertMember(userId, data.workspaceId);

    const event = await this.prisma.event.create({
      data: {
        workspaceId: data.workspaceId,
        title: data.title,
        descriptionMd: data.descriptionMd ?? null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        allDay: data.allDay ?? false,
        color: data.color ?? null,
        createdById: userId
      }
    });

    return this.toEventDto(event);
  }

  async update(
    userId: string,
    workspaceId: string,
    eventId: string,
    data: UpdateEventDto
  ): Promise<Event> {
    await this.workspaces.assertMember(userId, workspaceId);

    const existing = await this.prisma.event.findFirst({
      where: { id: eventId, workspaceId }
    });
    if (!existing) throw new NotFoundException("Event not found");

    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        descriptionMd: data.descriptionMd,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        allDay: data.allDay,
        color: data.color
      }
    });

    return this.toEventDto(event);
  }

  async delete(userId: string, workspaceId: string, eventId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, workspaceId }
    });
    if (!event) throw new NotFoundException("Event not found");

    await this.prisma.event.delete({ where: { id: eventId } });
    return { success: true };
  }

  async getEventsForDate(userId: string, workspaceId: string, date: string): Promise<Event[]> {
    await this.workspaces.assertMember(userId, workspaceId);

    const startOfDay = new Date(date + "T00:00:00.000Z");
    const endOfDay = new Date(date + "T23:59:59.999Z");

    const events = await this.prisma.event.findMany({
      where: {
        workspaceId,
        OR: [
          { startAt: { gte: startOfDay, lte: endOfDay } },
          { endAt: { gte: startOfDay, lte: endOfDay } },
          { AND: [{ startAt: { lte: startOfDay } }, { endAt: { gte: endOfDay } }] }
        ]
      },
      orderBy: { startAt: "asc" }
    });

    return events.map(this.toEventDto);
  }

  private toEventDto(event: {
    id: string;
    workspaceId: string;
    title: string;
    descriptionMd: string | null;
    startAt: Date;
    endAt: Date;
    allDay: boolean;
    color: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): Event {
    return {
      id: event.id,
      workspaceId: event.workspaceId,
      title: event.title,
      descriptionMd: event.descriptionMd,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      allDay: event.allDay,
      color: event.color,
      createdById: event.createdById,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    };
  }
}
