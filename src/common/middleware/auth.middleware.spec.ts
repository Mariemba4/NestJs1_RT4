import { describe, it, expect, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware.js';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';
import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  const originalEnv = process.env.JWT_SECRET;
  const testSecret = 'test_secret_key_12345';

  beforeEach(() => {
    middleware = new AuthMiddleware();
    process.env.JWT_SECRET = testSecret;
  });

  const mockRes = {} as Response;

  it('1. Header absent -> 401', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const next: NextFunction = vi.fn();

    expect(() => middleware.use(req, mockRes, next)).toThrow(UnauthorizedException);
    try {
      middleware.use(req, mockRes, next);
    } catch (e: any) {
      expect(e.getStatus()).toBe(401);
      expect(e.getResponse().message).toContain('Header auth-user manquant');
    }
  });

  it('2. Token invalide -> 401', () => {
    const req = {
      headers: { 'auth-user': 'invalid.token.here' },
    } as unknown as AuthenticatedRequest;
    const next: NextFunction = vi.fn();

    expect(() => middleware.use(req, mockRes, next)).toThrow(UnauthorizedException);
    try {
      middleware.use(req, mockRes, next);
    } catch (e: any) {
      expect(e.getStatus()).toBe(401);
    }
  });

  it('3. Token sans userId -> 401', () => {
    const token = jwt.sign({ name: 'Alice' }, testSecret);
    const req = {
      headers: { 'auth-user': token },
    } as unknown as AuthenticatedRequest;
    const next: NextFunction = vi.fn();

    expect(() => middleware.use(req, mockRes, next)).toThrow(UnauthorizedException);
    try {
      middleware.use(req, mockRes, next);
    } catch (e: any) {
      expect(e.getStatus()).toBe(401);
      expect(e.getResponse().message).toContain('userId manquant');
    }
  });

  it('4. Token valide -> injecte req.userId et appelle next()', () => {
    const token = jwt.sign({ userId: 'user-42' }, testSecret);
    const req = {
      headers: { 'auth-user': token },
    } as unknown as AuthenticatedRequest;
    let nextCalled = false;
    const next: NextFunction = (() => {
      nextCalled = true;
    }) as NextFunction;

    middleware.use(req, mockRes, next);

    expect(nextCalled).toBe(true);
    expect(req.userId).toBe('user-42');
  });
});

