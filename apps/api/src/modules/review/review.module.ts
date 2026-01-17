import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { TasksModule } from "../tasks/tasks.module";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";

@Module({
  imports: [PrismaModule, WorkspacesModule, TasksModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService]
})
export class ReviewModule {}
