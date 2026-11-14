import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { UserEntity } from '../user/entities/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';




@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}
    async register(dto: RegisterDto) {
    const salt = await bcrypt.genSalt();

    dto.password = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create(dto);
    try {
      await this.userRepository.save(user);
    } catch (e) {

      throw new ConflictException('Username ou email déjà utilisé');
    }
    // Renvoyer l'utilisateur SANS le mot de passe
    const { password, ...result } = user;
    return result;
  }
    async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [
        { username: dto.identifiant },
        { email: dto.identifiant },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Comparer le mot de passe tapé avec le hash en base
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };

  }
}


