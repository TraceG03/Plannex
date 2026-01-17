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
import { z } from "zod";
import { IdSchema, WorkspaceRoleSchema } from "@planner/shared";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { WorkspacesService } from "./workspaces.service";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100)
});

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional()
});

const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: WorkspaceRoleSchema.optional()
});

const UpdateMemberRoleSchema = z.object({
  role: WorkspaceRoleSchema
});

@Controller("workspaces")
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspaces: WorkspacesService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.workspaces.listForUser(user.userId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateWorkspaceSchema)) body: z.infer<typeof CreateWorkspaceSchema>
  ) {
    return this.workspaces.create(user.userId, body);
  }

  @Get(":id")
  async getById(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.workspaces.getById(user.userId, id);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(UpdateWorkspaceSchema)) body: z.infer<typeof UpdateWorkspaceSchema>
  ) {
    return this.workspaces.update(user.userId, id, body);
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.workspaces.delete(user.userId, id);
  }

  @Get(":id/members")
  async listMembers(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string
  ) {
    return this.workspaces.listMembers(user.userId, id);
  }

  @Post(":id/members")
  async inviteMember(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Body(new ZodValidationPipe(InviteMemberSchema)) body: z.infer<typeof InviteMemberSchema>
  ) {
    return this.workspaces.inviteMember(user.userId, id, body);
  }

  @Patch(":id/members/:userId")
  async updateMemberRole(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Param("userId", new ZodValidationPipe(IdSchema)) targetUserId: string,
    @Body(new ZodValidationPipe(UpdateMemberRoleSchema))
    body: z.infer<typeof UpdateMemberRoleSchema>
  ) {
    return this.workspaces.updateMemberRole(user.userId, id, targetUserId, body.role);
  }

  @Delete(":id/members/:userId")
  async removeMember(
    @CurrentUser() user: RequestUser,
    @Param("id", new ZodValidationPipe(IdSchema)) id: string,
    @Param("userId", new ZodValidationPipe(IdSchema)) targetUserId: string
  ) {
    return this.workspaces.removeMember(user.userId, id, targetUserId);
  }
}
