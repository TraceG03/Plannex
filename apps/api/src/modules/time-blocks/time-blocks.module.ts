import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { TimeBlocksController } from "./time-blocks.controller";
import { TimeBlocksService } from "./time-blocks.service";

@Module({
  imports: [PrismaModule, WorkspacesModule],
  controllers: [TimeBlocksController],
  providers: [TimeBlocksService],
  exports: [TimeBlocksService]
})
export class TimeBlocksModule {}
