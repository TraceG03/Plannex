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
import { ChannelsService } from "./channels.service";

const CreateChannelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  notesMd: z.string().max(50_000).optional()
});

const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  notesMd: z.string().max(50_000).nullable().optional()
});

@Controller("workspaces/:wsId/channels")
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channels: ChannelsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string
  ) {
    return this.channels.list(user.userId, wsId);
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.channels.getById(user.userId, wsId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Body(new ZodValidationPipe(CreateChannelSchema)) body: z.infer<typeof CreateChannelSchema>
  ) {
    return this.channels.create(user.userId, wsId, body);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateChannelSchema)) body: z.infer<typeof UpdateChannelSchema>
  ) {
    return this.channels.update(user.userId, wsId, id, body);
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.channels.delete(user.userId, wsId, id);
  }
}
