import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { NotificationsService } from "./notifications.service";

const ListQuerySchema = z.object({
  unreadOnly: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().default(false)
  ),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(ListQuerySchema)) query: z.infer<typeof ListQuerySchema>
  ) {
    return this.notifications.listForUser(user.userId, query);
  }

  @Get("count")
  async unreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.notifications.getUnreadCount(user.userId);
    return { count };
  }

  @Post(":id/read")
  async markAsRead(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.notifications.markAsRead(user.userId, id);
  }

  @Post("read-all")
  async markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllAsRead(user.userId);
  }
}
