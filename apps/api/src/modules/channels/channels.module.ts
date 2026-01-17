import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { ChannelsController } from "./channels.controller";
import { ChannelsService } from "./channels.service";

@Module({
  imports: [PrismaModule, WorkspacesModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService]
})
export class ChannelsModule {}
