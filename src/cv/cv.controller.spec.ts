import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { JwtStrategy } from '../auth/strategies/jwt.strategy.js';
import { UserEntity } from '../user/entities/user.entity.js';
import { UserRoleEnum } from '../user/enums/role.enum.js';
import { CvController } from './cv.controller.js';
import { CvService } from './cv.service.js';

// Test HTTP : seule la base est simulée, la vraie chaîne JWT/Passport/guard est exécutée.
describe('CvController - routes protégées (ex. 12)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const cvService = { findAll: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({ id: 1 }) };
  const users: Record<number, UserEntity> = {
    1: { id: 1, role: UserRoleEnum.USER } as UserEntity,
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: 'test-secret' }),
      ],
      controllers: [CvController],
      providers: [
        JwtStrategy,
        { provide: CvService, useValue: cvService },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: { findOneBy: ({ id }: { id: number }) => Promise.resolve(users[id] ?? null) },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(() => app.close());

  it('sans token -> 401', async () => {
    await request(app.getHttpServer()).get('/cvs').expect(401);
  });

  it('token invalide -> 401', async () => {
    await request(app.getHttpServer()).get('/cvs').set('Authorization', 'Bearer nope').expect(401);
  });

  it('token d’un utilisateur supprimé -> 401', async () => {
    const token = jwt.sign({ id: 404 });
    await request(app.getHttpServer()).get('/cvs').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('token valide -> 200 et le service reçoit l’utilisateur connecté', async () => {
    const token = jwt.sign({ id: 1 });
    await request(app.getHttpServer()).get('/cvs').set('Authorization', `Bearer ${token}`).expect(200);
    expect(cvService.findAll).toHaveBeenCalledWith(users[1]);
  });

  const body = { name: 'a', firstname: 'b', age: 20, cin: '12345678', job: 'dev', path: 'p' };

  it('POST : le propriétaire est le user connecté', async () => {
    const token = jwt.sign({ id: 1 });
    await request(app.getHttpServer())
      .post('/cvs')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);
    const [, user] = cvService.create.mock.calls[0];
    expect(user.id).toBe(1);
  });

  it('POST : impossible d’imposer un autre propriétaire via userId -> 400', async () => {
    const token = jwt.sign({ id: 1 });
    await request(app.getHttpServer())
      .post('/cvs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...body, userId: 99 })
      .expect(400);
  });
});
