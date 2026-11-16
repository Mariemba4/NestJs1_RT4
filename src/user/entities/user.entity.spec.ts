import { describe, expect, it } from 'vitest';
import { instanceToPlain } from 'class-transformer';
import { UserEntity } from './user.entity.js';

describe('UserEntity - sérialisation', () => {
  it('le hash du mot de passe n’est jamais renvoyé', () => {
    const user = Object.assign(new UserEntity(), { id: 1, username: 'a', password: 'hash' });
    const plain = instanceToPlain(user);
    expect(plain).not.toHaveProperty('password');
    expect(plain).toMatchObject({ id: 1, username: 'a' });
  });
});
