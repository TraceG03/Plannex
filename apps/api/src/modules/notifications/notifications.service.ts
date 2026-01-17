import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationType } from "@prisma/client";

interface CreateNotificationDto {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface NotificationDto {
  id: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: unknown;
  createdAt: string;
  readAt: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly ? { readAt: null } : {})
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50
    });

    return notifications.map(this.toDto);
  }

  async create(data: CreateNotificationDto): Promise<NotificationDto> {
    const notification = await this.prisma.notification.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        data: data.data as any
      }
    });

    return this.toDto(notification);
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    const notification = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() }
    });

    const updated = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });
    if (!updated) throw new Error("Notification not found");

    return this.toDto(updated);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });

    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null }
    });
  }

  // Helper methods for creating specific notification types
  async notifyMention(
    workspaceId: string,
    userId: string,
    mentionerName: string,
    taskTitle: string,
    taskId: string
  ) {
    return this.create({
      workspaceId,
      userId,
      type: NotificationType.mention,
      title: `${mentionerName} mentioned you`,
      body: `In task: ${taskTitle}`,
      data: { taskId }
    });
  }

  async notifyAssignment(
    workspaceId: string,
    userId: string,
    assignerName: string,
    taskTitle: string,
    taskId: string
  ) {
    return this.create({
      workspaceId,
      userId,
      type: NotificationType.assigned,
      title: `${assignerName} assigned you a task`,
      body: taskTitle,
      data: { taskId }
    });
  }

  async notifyReminder(
    workspaceId: string,
    userId: string,
    title: string,
    body: string,
    data: { taskId?: string; eventId?: string }
  ) {
    return this.create({
      workspaceId,
      userId,
      type: NotificationType.reminder,
      title,
      body,
      data
    });
  }

  private toDto(notification: {
    id: string;
    workspaceId: string;
    type: NotificationType;
    title: string;
    body: string | null;
    data: unknown;
    createdAt: Date;
    readAt: Date | null;
  }): NotificationDto {
    return {
      id: notification.id,
      workspaceId: notification.workspaceId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null
    };
  }
}
