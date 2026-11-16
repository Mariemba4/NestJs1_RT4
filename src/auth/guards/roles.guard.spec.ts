import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class AdminRoute { @Roles('admin') handler() {} }
class FreeRoute { handler() {} }
class FutureRoleRoute { @Roles('admin', 'moderator') handler() {} }

const ctx = (cls: any, user?: { role: string }) =>
  ({
    getHandler: () => cls.prototype.handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as any;

describe('RolesGuard (ex. 13)', () => {
  const guard = new RolesGuard(new Reflector());

  it('admin -> accès autorisé', () => {
    expect(guard.canActivate(ctx(AdminRoute, { role: 'admin' }))).toBe(true);
  });

  it('simple user -> 403', () => {
    expect(() => guard.canActivate(ctx(AdminRoute, { role: 'user' }))).toThrow(ForbiddenException);
  });

  it('pas d’utilisateur -> 403', () => {
    expect(() => guard.canActivate(ctx(AdminRoute))).toThrow(ForbiddenException);
  });

  it('route sans @Roles -> accessible', () => {
    expect(guard.canActivate(ctx(FreeRoute, { role: 'user' }))).toBe(true);
  });

  it('un nouveau rôle fonctionne sans modifier le guard', () => {
    expect(guard.canActivate(ctx(FutureRoleRoute, { role: 'moderator' }))).toBe(true);
  });
});
