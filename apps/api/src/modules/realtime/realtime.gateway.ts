import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.APP_ORIGIN ?? "http://localhost:3000",
    credentials: true
  }
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private prisma: PrismaService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token?.replace("Bearer ", "");
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify(token) as { sub: string };
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true }
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.userId = user.id;

      // Join user's personal room for notifications
      client.join(`user:${user.id}`);

      console.log(`Client connected: ${client.id}, userId: ${user.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join:workspace")
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string }
  ) {
    if (!client.userId) return;

    // Verify membership
    const membership = await this.prisma.workspaceMembership.findUnique({
      where: {
        workspaceId_userId: { workspaceId: data.workspaceId, userId: client.userId }
      }
    });

    if (membership) {
      client.join(`workspace:${data.workspaceId}`);
      return { success: true };
    }

    return { success: false, error: "Not a member" };
  }

  @SubscribeMessage("leave:workspace")
  handleLeaveWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string }
  ) {
    client.leave(`workspace:${data.workspaceId}`);
    return { success: true };
  }

  // Emit methods for other services to use
  emitToWorkspace(workspaceId: string, event: string, data: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
