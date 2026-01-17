import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { TagsController } from "./tags.controller";
import { TagsService } from "./tags.service";

@Module({
  imports: [PrismaModule, WorkspacesModule],
  controllers: [TasksController, CommentsController, TagsController],
  providers: [TasksService, CommentsService, TagsService],
  exports: [TasksService, CommentsService]
})
export class TasksModule {}
