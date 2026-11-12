import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface.js';

interface JwtPayloadWithUser {
  userId: string | number;
  [key: string]: unknown;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['auth-user'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Header auth-user manquant ou invalide',
        error: 'Unauthorized',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Clé secrète JWT non configurée',
        error: 'Unauthorized',
      });
    }

    try {
      const decoded = verify(authHeader, secret);

      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        !('userId' in decoded) ||
        (decoded as JwtPayloadWithUser).userId === undefined ||
        (decoded as JwtPayloadWithUser).userId === null
      ) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Token invalide ou userId manquant',
          error: 'Unauthorized',
        });
      }

      req.userId = (decoded as JwtPayloadWithUser).userId;
      next();
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Token JWT invalide ou expiré',
        error: 'Unauthorized',
      });
    }
  }
}

