import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { RemindersController } from "./reminders.controller";
import { RemindersService } from "./reminders.service";
import { RemindersProcessor } from "./reminders.processor";

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    RealtimeModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>("REDIS_URL") ?? "redis://localhost:6379"
        }
      }),
      inject: [ConfigService]
    }),
    BullModule.registerQueue({
      name: "reminders"
    })
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService]
})
export class RemindersModule {}
