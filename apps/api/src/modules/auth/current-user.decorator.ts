import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  userId: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestUser;
  }
);
