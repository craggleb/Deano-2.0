import { beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../lib/database';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
