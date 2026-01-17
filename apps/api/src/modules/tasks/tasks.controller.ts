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
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  IdSchema,
  TaskStatusSchema,
  PrioritySchema,
  PaginationSchema
} from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { TasksService } from "./tasks.service";

const TaskFiltersSchema = z.object({
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  assigneeId: IdSchema.optional(),
  projectId: IdSchema.optional(),
  channelId: IdSchema.optional(),
  tagIds: z.string().optional().transform((s) => s?.split(",").filter(Boolean)),
  dueBefore: z.string().datetime({ offset: true }).optional(),
  dueAfter: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50)
});

@Controller("workspaces/:wsId/tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Query(new ZodValidationPipe(TaskFiltersSchema)) query: z.infer<typeof TaskFiltersSchema>
  ) {
    return this.tasks.list(user.userId, wsId, query);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(CreateTaskSchema.omit({ workspaceId: true })))
    body: Omit<z.infer<typeof CreateTaskSchema>, "workspaceId">
  ) {
    return this.tasks.create(user.userId, { ...body, workspaceId: wsId });
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.tasks.getById(user.userId, wsId, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateTaskSchema.omit({ id: true })))
    body: Omit<z.infer<typeof UpdateTaskSchema>, "id">
  ) {
    return this.tasks.update(user.userId, wsId, { ...body, id });
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.tasks.delete(user.userId, wsId, id);
  }
}
