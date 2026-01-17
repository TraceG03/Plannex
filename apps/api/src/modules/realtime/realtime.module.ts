import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../../prisma/prisma.module";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeService } from "./realtime.service";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_secret_change_me"
    })
  ],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService]
})
export class RealtimeModule {}
