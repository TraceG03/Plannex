import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? "dev_secret_change_me",
      signOptions: { expiresIn: "7d" }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard]
})
export class AuthModule {}

export { JwtAuthGuard } from "./jwt-auth.guard";
export { CurrentUser } from "./current-user.decorator";
export type { RequestUser } from "./current-user.decorator";
