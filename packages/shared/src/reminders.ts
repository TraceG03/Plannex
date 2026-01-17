export type ReminderTarget =
  | { type: "task"; taskId: string }
  | { type: "event"; eventId: string };

export type ReminderSpec = {
  userId: string;
  workspaceId: string;
  target: ReminderTarget;
  remindAt: Date;
  /**
   * Free-form string for UI (“15m before”, “at time of event”, etc.)
   */
  label?: string;
};

export function computeRemindAtFromDue(dueAt: Date, minutesBefore: number): Date {
  return new Date(dueAt.getTime() - minutesBefore * 60_000);
}

export function isDueForDelivery(now: Date, remindAt: Date): boolean {
  return remindAt.getTime() <= now.getTime();
}

