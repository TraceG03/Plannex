import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { CreateEventSchema, IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { EventsService } from "./events.service";

const EventFiltersSchema = z.object({
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional()
});

const UpdateEventSchema = z.object({
  title: z.string().min(1).max(240).optional(),
  descriptionMd: z.string().max(50_000).nullable().optional(),
  startAt: z.string().datetime({ offset: true }).optional(),
  endAt: z.string().datetime({ offset: true }).optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(32).nullable().optional()
});

@Controller("workspaces/:wsId/events")
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private events: EventsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Query(new ZodValidationPipe(EventFiltersSchema)) query: z.infer<typeof EventFiltersSchema>
  ) {
    return this.events.list(user.userId, wsId, query);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(CreateEventSchema.omit({ workspaceId: true })))
    body: Omit<z.infer<typeof CreateEventSchema>, "workspaceId">
  ) {
    return this.events.create(user.userId, { ...body, workspaceId: wsId });
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.events.getById(user.userId, wsId, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateEventSchema)) body: z.infer<typeof UpdateEventSchema>
  ) {
    return this.events.update(user.userId, wsId, id, body);
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.events.delete(user.userId, wsId, id);
  }
}
