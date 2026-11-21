import { describe, expect, test } from 'vitest';
import { getDb } from '../src/db/connect.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

describe('user and role models', () => {
  test('seeds the customer and admin roles', async () => {
    const roles = await getDb().collection('roles').find({}, { projection: { _id: 0 } }).toArray();

    expect(roles).toEqual(expect.arrayContaining([
      { name: 'customer' },
      { name: 'admin' }
    ]));
  });

  test('requires a valid role name', async () => {
    const role = new Role({ name: 'moderator' });

    await expect(role.validate()).rejects.toMatchObject({
      errors: {
        name: expect.anything()
      }
    });
  });

  test('requires account fields and references the Role model', async () => {
    const user = new User({});

    await expect(user.validate()).rejects.toMatchObject({
      errors: {
        name: expect.anything(),
        username: expect.anything(),
        email: expect.anything(),
        passwordHash: expect.anything(),
        role: expect.anything()
      }
    });
    expect(User.schema.path('role').options.ref).toBe('Role');
  });

  test('normalizes email addresses to lowercase', () => {
    const user = new User({
      name: 'Sample User',
      username: 'sample',
      email: 'SAMPLE@EXAMPLE.COM',
      passwordHash: 'hashed-password',
      role: '507f1f77bcf86cd799439011'
    });

    expect(user.email).toBe('sample@example.com');
  });
});
