import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreateCommentSchema, IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { CommentsService } from "./comments.service";

@Controller("workspaces/:wsId/tasks/:taskId/comments")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("taskId", new ZodValidationPipe(IdSchema)) taskId: string
  ) {
    return this.comments.listForTask(user.userId, wsId, taskId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("taskId", new ZodValidationPipe(IdSchema)) taskId: string,
    @Body(new ZodValidationPipe(CreateCommentSchema.omit({ taskId: true })))
    body: Omit<z.infer<typeof CreateCommentSchema>, "taskId">
  ) {
    return this.comments.create(user.userId, wsId, { ...body, taskId });
  }
}
