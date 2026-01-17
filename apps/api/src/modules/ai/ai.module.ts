import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { TasksModule } from "../tasks/tasks.module";
import { EventsModule } from "../events/events.module";
import { TimeBlocksModule } from "../time-blocks/time-blocks.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  imports: [ConfigModule, PrismaModule, WorkspacesModule, TasksModule, EventsModule, TimeBlocksModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}
