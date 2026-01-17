import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { PlanMyDayRequestSchema, SummarizeWeekRequestSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private ai: AiService) {}

  @Post("plan-day")
  async planDay(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(PlanMyDayRequestSchema)) body: z.infer<typeof PlanMyDayRequestSchema>
  ) {
    return this.ai.planDay(user.userId, body);
  }

  @Post("summarize-week")
  async summarizeWeek(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(SummarizeWeekRequestSchema))
    body: z.infer<typeof SummarizeWeekRequestSchema>
  ) {
    return this.ai.summarizeWeek(user.userId, body);
  }
}
