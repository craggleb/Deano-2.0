import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectDatabase, disconnectDatabase, prisma } from '../lib/database';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

beforeEach(async () => {
  // Clean up all data before each test in correct order
  await prisma.taskLabel.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.label.deleteMany();
});
