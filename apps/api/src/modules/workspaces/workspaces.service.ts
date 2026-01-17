import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspaceRole } from "@prisma/client";

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.workspaceMembership.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { memberships: true, tasks: true, projects: true } }
          }
        }
      }
    });
    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      memberCount: m.workspace._count.memberships,
      taskCount: m.workspace._count.tasks,
      projectCount: m.workspace._count.projects,
      createdAt: m.workspace.createdAt.toISOString()
    }));
  }

  async create(userId: string, data: { name: string }) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        memberships: {
          create: { userId, role: WorkspaceRole.owner }
        }
      }
    });
    return {
      id: workspace.id,
      name: workspace.name,
      role: WorkspaceRole.owner,
      createdAt: workspace.createdAt.toISOString()
    };
  }

  async getById(userId: string, workspaceId: string) {
    await this.assertMember(userId, workspaceId);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: { select: { memberships: true, tasks: true, projects: true, channels: true } }
      }
    });
    if (!workspace) throw new NotFoundException("Workspace not found");
    return {
      id: workspace.id,
      name: workspace.name,
      memberCount: workspace._count.memberships,
      taskCount: workspace._count.tasks,
      projectCount: workspace._count.projects,
      channelCount: workspace._count.channels,
      createdAt: workspace.createdAt.toISOString()
    };
  }

  async update(userId: string, workspaceId: string, data: { name?: string }) {
    await this.assertAdminOrOwner(userId, workspaceId);
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: data.name }
    });
    return { id: workspace.id, name: workspace.name };
  }

  async delete(userId: string, workspaceId: string) {
    await this.assertOwner(userId, workspaceId);
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
    return { success: true };
  }

  async listMembers(userId: string, workspaceId: string) {
    await this.assertMember(userId, workspaceId);
    const memberships = await this.prisma.workspaceMembership.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, email: true, name: true } } }
    });
    return memberships.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      joinedAt: m.createdAt.toISOString()
    }));
  }

  async inviteMember(
    userId: string,
    workspaceId: string,
    data: { email: string; role?: WorkspaceRole }
  ) {
    await this.assertAdminOrOwner(userId, workspaceId);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new NotFoundException("User not found with that email");

    const existing = await this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } }
    });
    if (existing) throw new ForbiddenException("User is already a member");

    const membership = await this.prisma.workspaceMembership.create({
      data: {
        workspaceId,
        userId: user.id,
        role: data.role ?? WorkspaceRole.member
      },
      include: { user: { select: { id: true, email: true, name: true } } }
    });
    return {
      userId: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      role: membership.role
    };
  }

  async updateMemberRole(
    userId: string,
    workspaceId: string,
    targetUserId: string,
    role: WorkspaceRole
  ) {
    await this.assertOwner(userId, workspaceId);
    if (userId === targetUserId && role !== WorkspaceRole.owner) {
      throw new ForbiddenException("Cannot demote yourself as owner");
    }
    const membership = await this.prisma.workspaceMembership.update({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
      data: { role }
    });
    return { userId: targetUserId, role: membership.role };
  }

  async removeMember(userId: string, workspaceId: string, targetUserId: string) {
    const membership = await this.assertAdminOrOwner(userId, workspaceId);
    const targetMembership = await this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } }
    });
    if (!targetMembership) throw new NotFoundException("Member not found");

    if (targetMembership.role === WorkspaceRole.owner) {
      throw new ForbiddenException("Cannot remove workspace owner");
    }
    if (
      membership.role === WorkspaceRole.admin &&
      targetMembership.role === WorkspaceRole.admin &&
      userId !== targetUserId
    ) {
      throw new ForbiddenException("Admins cannot remove other admins");
    }

    await this.prisma.workspaceMembership.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } }
    });
    return { success: true };
  }

  // Permission helpers
  async getMembership(userId: string, workspaceId: string) {
    return this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
  }

  async assertMember(userId: string, workspaceId: string) {
    const membership = await this.getMembership(userId, workspaceId);
    if (!membership) throw new ForbiddenException("Not a member of this workspace");
    return membership;
  }

  async assertAdminOrOwner(userId: string, workspaceId: string) {
    const membership = await this.assertMember(userId, workspaceId);
    if (membership.role === WorkspaceRole.member) {
      throw new ForbiddenException("Admin or owner access required");
    }
    return membership;
  }

  async assertOwner(userId: string, workspaceId: string) {
    const membership = await this.assertMember(userId, workspaceId);
    if (membership.role !== WorkspaceRole.owner) {
      throw new ForbiddenException("Owner access required");
    }
    return membership;
  }
}
