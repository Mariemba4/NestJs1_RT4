import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRoleEnum } from '../user/enums/role.enum.js';
import { CvService } from './cv.service.js';

const user = { id: 1, role: UserRoleEnum.USER };
const other = { id: 2, role: UserRoleEnum.USER };
const admin = { id: 9, role: UserRoleEnum.ADMIN };
const cvOf = (id: number, userId: number) => ({ id, userId, skills: [] });

describe('CvService - propriété et rôles (ex. 12 et 14)', () => {
  let service: CvService;
  let cvRepo: any;

  beforeEach(() => {
    cvRepo = {
      create: vi.fn((x) => x),
      save: vi.fn((x) => Promise.resolve(x)),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    service = new CvService(cvRepo, { findBy: vi.fn() } as any);
  });

  it('create : le propriétaire est le user connecté', async () => {
    await service.create(
      { name: 'a', firstname: 'b', age: 20, cin: '12345678', job: 'dev', path: 'p' },
      user,
    );
    expect(cvRepo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }));
  });

  it('ex.14 findAll : un user ne voit que ses CV', async () => {
    await service.findAll(user);
    expect(cvRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1 } }));
  });

  it('ex.14 findAll : un admin voit tous les CV', async () => {
    await service.findAll(admin);
    expect(cvRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('findOne : CV d’un autre -> 403 ; le sien et admin -> OK', async () => {
    cvRepo.findOne.mockResolvedValue(cvOf(5, 1));
    await expect(service.findOne(5, other)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.findOne(5, user)).resolves.toMatchObject({ id: 5 });
    await expect(service.findOne(5, admin)).resolves.toMatchObject({ id: 5 });
  });

  it('update : CV d’un autre -> 403 sans sauvegarde ; le sien -> OK', async () => {
    cvRepo.findOne.mockResolvedValue(cvOf(5, 1));
    await expect(service.update(5, { job: 'x' }, other)).rejects.toBeInstanceOf(ForbiddenException);
    expect(cvRepo.save).not.toHaveBeenCalled();
    await expect(service.update(5, { job: 'x' }, user)).resolves.toMatchObject({ job: 'x' });
  });

  it('update/remove : même un admin ne modifie pas le CV d’un autre', async () => {
    cvRepo.findOne.mockResolvedValue(cvOf(5, 1));
    await expect(service.update(5, { job: 'x' }, admin)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove(5, admin)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('remove : CV d’un autre -> 403 sans suppression ; le sien -> OK', async () => {
    cvRepo.findOne.mockResolvedValue(cvOf(5, 1));
    await expect(service.remove(5, other)).rejects.toBeInstanceOf(ForbiddenException);
    expect(cvRepo.remove).not.toHaveBeenCalled();
    await service.remove(5, user);
    expect(cvRepo.remove).toHaveBeenCalled();
  });

  it('CV inexistant -> 404', async () => {
    cvRepo.findOne.mockResolvedValue(null);
    await expect(service.remove(5, user)).rejects.toBeInstanceOf(NotFoundException);
  });
});
