import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { TasksModule } from "../tasks/tasks.module";
import { TemplatesController } from "./templates.controller";
import { TemplatesService } from "./templates.service";

@Module({
  imports: [PrismaModule, WorkspacesModule, TasksModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService]
})
export class TemplatesModule {}
