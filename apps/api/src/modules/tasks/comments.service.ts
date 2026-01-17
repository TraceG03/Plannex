import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { parseMentions, CreateComment, Comment } from "@planner/shared";

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private workspaces: WorkspacesService
  ) {}

  async listForTask(userId: string, workspaceId: string, taskId: string) {
    await this.workspaces.assertMember(userId, workspaceId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId }
    });
    if (!task) throw new NotFoundException("Task not found");

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, email: true, name: true } },
        mentions: { select: { mentionedUserId: true } }
      }
    });

    return comments.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      author: c.author,
      bodyMd: c.bodyMd,
      mentionedUserIds: c.mentions.map((m) => m.mentionedUserId),
      createdAt: c.createdAt.toISOString()
    }));
  }

  async create(
    userId: string,
    workspaceId: string,
    data: CreateComment
  ): Promise<Comment & { mentionedUserIds: string[] }> {
    await this.workspaces.assertMember(userId, workspaceId);

    const task = await this.prisma.task.findFirst({
      where: { id: data.taskId, workspaceId }
    });
    if (!task) throw new NotFoundException("Task not found");

    // Parse mentions from comment body
    const mentions = parseMentions(data.bodyMd);
    const mentionedEmails = mentions.map((m) => m.identifier);

    // Find users by email
    const mentionedUsers = await this.prisma.user.findMany({
      where: {
        email: { in: mentionedEmails },
        memberships: { some: { workspaceId } }
      },
      select: { id: true, email: true }
    });

    const comment = await this.prisma.comment.create({
      data: {
        taskId: data.taskId,
        authorId: userId,
        bodyMd: data.bodyMd,
        mentions: {
          create: mentionedUsers.map((u) => ({ mentionedUserId: u.id }))
        }
      },
      include: {
        author: { select: { id: true, email: true, name: true } }
      }
    });

    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      bodyMd: comment.bodyMd,
      mentionedUserIds: mentionedUsers.map((u) => u.id),
      createdAt: comment.createdAt.toISOString()
    };
  }
}
