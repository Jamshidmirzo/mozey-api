import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current user from the request object (set by Passport).
 * Usage: @CurrentUser() user: AdminJwtPayload
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
