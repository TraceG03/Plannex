import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { RemindersService } from "./reminders.service";

const CreateReminderSchema = z.object({
  workspaceId: IdSchema,
  taskId: IdSchema.optional(),
  eventId: IdSchema.optional(),
  remindAt: z.string().datetime({ offset: true }),
  label: z.string().max(200).optional()
});

@Controller("reminders")
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private reminders: RemindersService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("workspaceId", new ZodValidationPipe(IdSchema)) workspaceId: string
  ) {
    return this.reminders.listForUser(user.userId, workspaceId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateReminderSchema)) body: z.infer<typeof CreateReminderSchema>
  ) {
    return this.reminders.create({
      workspaceId: body.workspaceId,
      userId: user.userId,
      taskId: body.taskId,
      eventId: body.eventId,
      remindAt: new Date(body.remindAt),
      label: body.label
    });
  }

  @Delete(":id")
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.reminders.cancel(user.userId, id);
  }
}
