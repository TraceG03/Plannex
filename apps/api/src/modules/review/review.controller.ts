import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { IdSchema } from "@planner/shared";
import { z } from "zod";
import { ZodValidationPipe } from "../../common/zod";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { RequestUser } from "../auth/current-user.decorator";
import { ReviewService } from "./review.service";

const WeekQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

@Controller("workspaces/:wsId/weekly-review")
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private review: ReviewService) {}

  @Get()
  async getWeeklyReview(
    @CurrentUser() user: RequestUser,
    @Param("wsId", new ZodValidationPipe(IdSchema)) wsId: string,
    @Query(new ZodValidationPipe(WeekQuerySchema)) query: z.infer<typeof WeekQuerySchema>
  ) {
    return this.review.getWeeklyReview(user.userId, wsId, query.weekStart);
  }
}
