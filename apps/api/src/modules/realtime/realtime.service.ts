import { Injectable } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";
import { Task, Event, Comment } from "@planner/shared";

@Injectable()
export class RealtimeService {
  constructor(private gateway: RealtimeGateway) {}

  // Task events
  taskCreated(workspaceId: string, task: Task) {
    this.gateway.emitToWorkspace(workspaceId, "task:created", task);
  }

  taskUpdated(workspaceId: string, task: Task) {
    this.gateway.emitToWorkspace(workspaceId, "task:updated", task);
  }

  taskDeleted(workspaceId: string, taskId: string) {
    this.gateway.emitToWorkspace(workspaceId, "task:deleted", { id: taskId, workspaceId });
  }

  // Comment events
  commentCreated(workspaceId: string, comment: Comment & { mentionedUserIds: string[] }) {
    this.gateway.emitToWorkspace(workspaceId, "comment:created", comment);
  }

  // Event events
  eventCreated(workspaceId: string, event: Event) {
    this.gateway.emitToWorkspace(workspaceId, "event:created", event);
  }

  eventUpdated(workspaceId: string, event: Event) {
    this.gateway.emitToWorkspace(workspaceId, "event:updated", event);
  }

  eventDeleted(workspaceId: string, eventId: string) {
    this.gateway.emitToWorkspace(workspaceId, "event:deleted", { id: eventId, workspaceId });
  }

  // Time block events
  timeBlockCreated(workspaceId: string, block: unknown) {
    this.gateway.emitToWorkspace(workspaceId, "time-block:created", block);
  }

  timeBlockUpdated(workspaceId: string, block: unknown) {
    this.gateway.emitToWorkspace(workspaceId, "time-block:updated", block);
  }

  timeBlockDeleted(workspaceId: string, blockId: string) {
    this.gateway.emitToWorkspace(workspaceId, "time-block:deleted", { id: blockId, workspaceId });
  }

  // Notification events
  notificationNew(userId: string, notification: unknown) {
    this.gateway.emitToUser(userId, "notification:new", notification);
  }

  // Member events
  memberJoined(workspaceId: string, userId: string, role: string) {
    this.gateway.emitToWorkspace(workspaceId, "member:joined", { userId, workspaceId, role });
  }

  memberUpdated(workspaceId: string, userId: string, role: string) {
    this.gateway.emitToWorkspace(workspaceId, "member:updated", { userId, workspaceId, role });
  }

  memberLeft(workspaceId: string, userId: string) {
    this.gateway.emitToWorkspace(workspaceId, "member:left", { userId, workspaceId });
  }
}
