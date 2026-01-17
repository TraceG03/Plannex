import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { WorkspacesModule } from "./modules/workspaces/workspaces.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { EventsModule } from "./modules/events/events.module";
import { TimeBlocksModule } from "./modules/time-blocks/time-blocks.module";
import { TemplatesModule } from "./modules/templates/templates.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { AiModule } from "./modules/ai/ai.module";
import { RemindersModule } from "./modules/reminders/reminders.module";
import { ReviewModule } from "./modules/review/review.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    TasksModule,
    ProjectsModule,
    ChannelsModule,
    EventsModule,
    TimeBlocksModule,
    TemplatesModule,
    NotificationsModule,
    RealtimeModule,
    AiModule,
    RemindersModule,
    ReviewModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
