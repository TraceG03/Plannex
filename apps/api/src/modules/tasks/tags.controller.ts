import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { TagsService } from "./tags.service";

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().max(32).optional()
});

const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().max(32).nullable().optional()
});

@Controller("workspaces/:wsId/tags")
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private tags: TagsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string
  ) {
    return this.tags.list(user.userId, wsId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(CreateTagSchema)) body: z.infer<typeof CreateTagSchema>
  ) {
    return this.tags.create(user.userId, wsId, body);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateTagSchema)) body: z.infer<typeof UpdateTagSchema>
  ) {
    return this.tags.update(user.userId, wsId, id, body);
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.tags.delete(user.userId, wsId, id);
  }
}
