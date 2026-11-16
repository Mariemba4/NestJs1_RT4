import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Exige un JWT valide, sinon 401. Place l'utilisateur dans request.user.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
