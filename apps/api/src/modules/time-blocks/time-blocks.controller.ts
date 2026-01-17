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
import { IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { TimeBlocksService } from "./time-blocks.service";

const DateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: IdSchema.optional()
});

const CreateTimeBlockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
  title: z.string().min(1).max(240),
  relatedTaskId: IdSchema.nullable().optional()
});

const UpdateTimeBlockSchema = z.object({
  startMin: z.number().int().min(0).max(1440).optional(),
  endMin: z.number().int().min(0).max(1440).optional(),
  title: z.string().min(1).max(240).optional(),
  relatedTaskId: IdSchema.nullable().optional()
});

const BatchCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocks: z.array(
    z.object({
      startMin: z.number().int().min(0).max(1440),
      endMin: z.number().int().min(0).max(1440),
      title: z.string().min(1).max(240),
      relatedTaskId: IdSchema.nullable().optional()
    })
  )
});

@Controller("workspaces/:wsId/time-blocks")
@UseGuards(JwtAuthGuard)
export class TimeBlocksController {
  constructor(private timeBlocks: TimeBlocksService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Query(new ZodValidationPipe(DateQuerySchema)) query: z.infer<typeof DateQuerySchema>
  ) {
    return this.timeBlocks.listForDate(user.userId, wsId, query.date, query.userId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(CreateTimeBlockSchema)) body: z.infer<typeof CreateTimeBlockSchema>
  ) {
    return this.timeBlocks.create(user.userId, wsId, body);
  }

  @Post("batch")
  async batchCreate(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(BatchCreateSchema)) body: z.infer<typeof BatchCreateSchema>
  ) {
    return this.timeBlocks.createBatch(user.userId, wsId, body.date, body.blocks);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateTimeBlockSchema)) body: z.infer<typeof UpdateTimeBlockSchema>
  ) {
    return this.timeBlocks.update(user.userId, wsId, id, body);
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.timeBlocks.delete(user.userId, wsId, id);
  }
}
