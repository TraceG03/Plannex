import { describe, expect, it } from "vitest";
import { computeRemindAtFromDue, isDueForDelivery } from "./reminders";

describe("reminders", () => {
  it("computes remindAt from due time", () => {
    const due = new Date("2026-01-16T12:00:00.000Z");
    const remindAt = computeRemindAtFromDue(due, 15);
    expect(remindAt.toISOString()).toBe("2026-01-16T11:45:00.000Z");
  });

  it("detects due-for-delivery", () => {
    const now = new Date("2026-01-16T11:45:00.000Z");
    expect(isDueForDelivery(now, new Date("2026-01-16T11:45:00.000Z"))).toBe(true);
    expect(isDueForDelivery(now, new Date("2026-01-16T11:46:00.000Z"))).toBe(false);
  });
});

