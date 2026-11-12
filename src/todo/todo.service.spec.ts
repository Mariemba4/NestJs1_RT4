import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TodoService } from './todo.service.js';
import type { Repository } from 'typeorm';
import type { TodoEntity } from './entities/todo.entity.js';
import { NotFoundException } from '@nestjs/common';

describe('TodoService - Authorization & Ownership', () => {
  let service: TodoService;
  let repo: Partial<Record<keyof Repository<TodoEntity>, any>>;

  beforeEach(() => {
    repo = {
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      findOne: vi.fn(),
      preload: vi.fn(),
      delete: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
    };
    service = new TodoService(repo as any);
  });

  it('4. Token valide -> création réussie avec userId enregistré', async () => {
    const result = await service.addTodoV2(
      { name: 'Test', description: 'Description valide 123' },
      'user-1',
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(result.userId).toBe('user-1');
  });

  it('5. Propriétaire -> modification autorisée', async () => {
    repo.findOne = vi.fn().mockResolvedValue({ id: 1, userId: 'user-1' });
    repo.preload = vi.fn().mockResolvedValue({ id: 1, name: 'Updated', userId: 'user-1' });
    repo.save = vi.fn().mockResolvedValue({ id: 1, name: 'Updated', userId: 'user-1' });

    const updated = await service.updateTodo(1, { name: 'Updated' }, 'user-1');
    expect(updated.name).toBe('Updated');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1, userId: 'user-1' } });
  });

  it('6. Autre utilisateur -> modification refusée (NotFoundException)', async () => {
    repo.findOne = vi.fn().mockResolvedValue(null);

    await expect(
      service.updateTodo(1, { name: 'Hack' }, 'user-2'),
    ).rejects.toThrow(NotFoundException);
  });

  it('5b. Propriétaire -> suppression définitive autorisée', async () => {
    repo.delete = vi.fn().mockResolvedValue({ affected: 1 });
    const res = await service.deleteTodo(1, 'user-1');
    expect(res.affected).toBe(1);
    expect(repo.delete).toHaveBeenCalledWith({ id: 1, userId: 'user-1' });
  });

  it('6b. Autre utilisateur -> suppression définitive refusée', async () => {
    repo.delete = vi.fn().mockResolvedValue({ affected: 0 });
    await expect(service.deleteTodo(1, 'user-2')).rejects.toThrow(NotFoundException);
  });

  it('5c. Propriétaire -> soft delete et restore autorisés', async () => {
    repo.findOne = vi.fn().mockResolvedValue({ id: 1, userId: 'user-1' });
    repo.softDelete = vi.fn().mockResolvedValue({ affected: 1 });
    repo.restore = vi.fn().mockResolvedValue({ affected: 1 });

    const softRes = await service.softdeleteTodo(1, 'user-1');
    expect(softRes.affected).toBe(1);

    const restoreRes = await service.restoreTodo(1, 'user-1');
    expect(restoreRes.affected).toBe(1);
  });

  it('6c. Autre utilisateur -> soft delete et restore refusés', async () => {
    repo.findOne = vi.fn().mockResolvedValue(null);

    await expect(service.softdeleteTodo(1, 'user-2')).rejects.toThrow(NotFoundException);
    await expect(service.restoreTodo(1, 'user-2')).rejects.toThrow(NotFoundException);
  });
});

