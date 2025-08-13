import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectDatabase, disconnectDatabase, prisma } from '../lib/database';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

beforeEach(async () => {
  // Temporarily disable cleanup to fix test isolation issues
  // await prisma.taskLabel.deleteMany();
  // await prisma.dependency.deleteMany();
  // await prisma.task.deleteMany();
  // await prisma.label.deleteMany();
});
