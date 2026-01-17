import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  AuthResponseSchema,
  LoginRequestSchema,
  SignupRequestSchema
} from "@planner/shared";
import { ZodValidationPipe } from "../../common/zod";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("signup")
  async signup(@Body(new ZodValidationPipe(SignupRequestSchema)) body: unknown) {
    const res = await this.auth.signup(SignupRequestSchema.parse(body));
    return AuthResponseSchema.parse(res);
  }

  @Post("login")
  async login(@Body(new ZodValidationPipe(LoginRequestSchema)) body: unknown) {
    const res = await this.auth.login(LoginRequestSchema.parse(body));
    return AuthResponseSchema.parse(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: { userId: string }) {
    return this.auth.me(user.userId);
  }
}

