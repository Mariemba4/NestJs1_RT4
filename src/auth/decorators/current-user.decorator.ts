import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserEntity } from '../../user/entities/user.entity.js';

// Récupère l'utilisateur connecté (request.user) : @CurrentUser() user
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity =>
    ctx.switchToHttp().getRequest<Request & { user: UserEntity }>().user,
);
