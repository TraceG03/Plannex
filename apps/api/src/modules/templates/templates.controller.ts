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
import { TemplatesService } from "./templates.service";

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  data: z.object({
    tasks: z.array(
      z.object({
        title: z.string().min(1).max(240),
        descriptionMd: z.string().max(50_000).nullable().optional(),
        priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
        color: z.string().max(32).nullable().optional()
      })
    )
  })
});

const ApplyTemplateSchema = z.object({
  projectId: IdSchema.optional(),
  channelId: IdSchema.optional()
});

@Controller("workspaces/:wsId/templates")
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templates: TemplatesService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string
  ) {
    return this.templates.list(user.userId, wsId);
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.templates.getById(user.userId, wsId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(CreateTemplateSchema)) body: z.infer<typeof CreateTemplateSchema>
  ) {
    return this.templates.create(user.userId, wsId, body);
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.templates.delete(user.userId, wsId, id);
  }

  @Post(":id/apply")
  async apply(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(ApplyTemplateSchema)) body: z.infer<typeof ApplyTemplateSchema>
  ) {
    return this.templates.apply(user.userId, wsId, id, body);
  }
}
