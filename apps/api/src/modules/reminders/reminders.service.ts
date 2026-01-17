import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { ReminderStatus } from "@prisma/client";
import { computeRemindAtFromDue } from "@planner/shared";

interface CreateReminderDto {
  workspaceId: string;
  userId: string;
  taskId?: string;
  eventId?: string;
  remindAt: Date;
  label?: string;
}

interface ReminderDto {
  id: string;
  workspaceId: string;
  userId: string;
  status: ReminderStatus;
  remindAt: string;
  taskId: string | null;
  eventId: string | null;
  label: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue("reminders") private remindersQueue: Queue
  ) {}

  async listForUser(userId: string, workspaceId: string): Promise<ReminderDto[]> {
    const reminders = await this.prisma.reminder.findMany({
      where: { userId, workspaceId, status: ReminderStatus.scheduled },
      orderBy: { remindAt: "asc" }
    });

    return reminders.map(this.toDto);
  }

  async create(data: CreateReminderDto): Promise<ReminderDto> {
    const reminder = await this.prisma.reminder.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        taskId: data.taskId ?? null,
        eventId: data.eventId ?? null,
        remindAt: data.remindAt,
        label: data.label ?? null,
        status: ReminderStatus.scheduled
      }
    });

    // Schedule the job
    const delay = Math.max(0, data.remindAt.getTime() - Date.now());
    await this.remindersQueue.add(
      "deliver",
      { reminderId: reminder.id },
      {
        delay,
        jobId: `reminder:${reminder.id}`,
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    return this.toDto(reminder);
  }

  async createForTask(
    workspaceId: string,
    userId: string,
    taskId: string,
    dueAt: Date,
    minutesBefore: number
  ): Promise<ReminderDto> {
    const remindAt = computeRemindAtFromDue(dueAt, minutesBefore);
    return this.create({
      workspaceId,
      userId,
      taskId,
      remindAt,
      label: `${minutesBefore} minutes before due`
    });
  }

  async createForEvent(
    workspaceId: string,
    userId: string,
    eventId: string,
    startAt: Date,
    minutesBefore: number
  ): Promise<ReminderDto> {
    const remindAt = computeRemindAtFromDue(startAt, minutesBefore);
    return this.create({
      workspaceId,
      userId,
      eventId,
      remindAt,
      label: `${minutesBefore} minutes before event`
    });
  }

  async cancel(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, userId }
    });
    if (!reminder) throw new NotFoundException("Reminder not found");

    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.cancelled }
    });

    // Remove from queue
    await this.remindersQueue.remove(`reminder:${reminderId}`);

    return { success: true };
  }

  async markDelivered(reminderId: string) {
    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: ReminderStatus.delivered,
        deliveredAt: new Date()
      }
    });
  }

  async getById(reminderId: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        task: { select: { id: true, title: true } },
        event: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, name: true } }
      }
    });
    return reminder;
  }

  private toDto(reminder: {
    id: string;
    workspaceId: string;
    userId: string;
    status: ReminderStatus;
    remindAt: Date;
    taskId: string | null;
    eventId: string | null;
    label: string | null;
    createdAt: Date;
    deliveredAt: Date | null;
  }): ReminderDto {
    return {
      id: reminder.id,
      workspaceId: reminder.workspaceId,
      userId: reminder.userId,
      status: reminder.status,
      remindAt: reminder.remindAt.toISOString(),
      taskId: reminder.taskId,
      eventId: reminder.eventId,
      label: reminder.label,
      createdAt: reminder.createdAt.toISOString(),
      deliveredAt: reminder.deliveredAt?.toISOString() ?? null
    };
  }
}
