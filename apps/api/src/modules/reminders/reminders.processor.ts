import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { RemindersService } from "./reminders.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RealtimeService } from "../realtime/realtime.service";

interface ReminderJobData {
  reminderId: string;
}

@Processor("reminders")
export class RemindersProcessor extends WorkerHost {
  constructor(
    private reminders: RemindersService,
    private notifications: NotificationsService,
    private realtime: RealtimeService
  ) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    const { reminderId } = job.data;

    const reminder = await this.reminders.getById(reminderId);
    if (!reminder || reminder.status !== "scheduled") {
      return; // Already delivered or cancelled
    }

    let title = "Reminder";
    let body = reminder.label ?? "You have a reminder";
    const data: { taskId?: string; eventId?: string } = {};

    if (reminder.task) {
      title = `Task reminder: ${reminder.task.title}`;
      body = reminder.label ?? `Don't forget: ${reminder.task.title}`;
      data.taskId = reminder.task.id;
    } else if (reminder.event) {
      title = `Event reminder: ${reminder.event.title}`;
      body = reminder.label ?? `Upcoming: ${reminder.event.title}`;
      data.eventId = reminder.event.id;
    }

    // Create in-app notification
    const notification = await this.notifications.notifyReminder(
      reminder.workspaceId,
      reminder.userId,
      title,
      body,
      data
    );

    // Send realtime notification
    this.realtime.notificationNew(reminder.userId, notification);

    // Mark as delivered
    await this.reminders.markDelivered(reminderId);

    console.log(`Delivered reminder ${reminderId} to user ${reminder.userId}`);
  }
}
