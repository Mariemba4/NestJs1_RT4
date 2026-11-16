import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity.js';

export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

/**
 * Vérifie la signature et l'expiration du JWT (Authorization: Bearer <token>).
 * validate() recharge l'utilisateur en base : le rôle est donc toujours à jour
 * et un utilisateur supprimé ne peut plus utiliser un ancien token.
 * Le résultat est placé dans request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET manquant : ajoutez-le dans le fichier .env');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ id: payload.id });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return user;
  }
}
