import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserEntity } from '../../user/entities/user.entity.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Ne laisse passer que les utilisateurs dont le rôle figure dans @Roles(...).
 * Le guard ne connaît aucun rôle en dur : ajouter un rôle ne demande aucune
 * modification ici. À placer après JwtAuthGuard (qui renseigne request.user).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<Request & { user?: UserEntity }>();
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Accès non autorisé pour votre rôle');
    }
    return true;
  }
}
