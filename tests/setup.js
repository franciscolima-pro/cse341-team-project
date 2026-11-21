import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { randomBytes } from 'node:crypto';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = randomBytes(32).toString('hex');
}

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
});
