import { z } from 'zod';
import { TaskStatus, Priority } from '@prisma/client';

// Base schemas
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const prioritySchema = z.nativeEnum(Priority);

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  status: taskStatusSchema.optional().default('Todo'),
  priority: prioritySchema.optional().default('Medium'),
  dueAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  estimatedDurationMinutes: z.number().int().min(0).optional().default(30),
  allowParentAutoComplete: z.boolean().optional().default(false),
  parentId: z.string().cuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueAt: z.string().datetime().nullable().optional().transform(val => val ? new Date(val) : null),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
  allowParentAutoComplete: z.boolean().optional(),
  parentId: z.string().cuid().nullable().optional(),
});

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  parentId: z.string().cuid().nullable().optional(),
  q: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// Dependency schemas
export const addDependencySchema = z.object({
  dependsOnTaskId: z.string().cuid(),
});

export const setDependenciesSchema = z.object({
  dependsOnTaskIds: z.array(z.string().cuid()),
});

// Completion schemas
export const completeTaskSchema = z.object({
  mode: z.enum(['normal', 'forceParentAutoComplete']).optional().default('normal'),
});

// Scheduling schemas
export const workingHoursSchema = z.object({
  start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),   // HH:mm format
  timezone: z.string().optional(),
});

export const scheduleOptionsSchema = z.object({
  filter: taskFilterSchema.partial().optional(),
  workingHours: workingHoursSchema.optional(),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  dailyCapacity: z.number().int().min(1).optional(),
  commit: z.boolean().optional().default(false),
});

// Bulk import schemas
export const bulkImportTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueAt: z.string().datetime().optional(),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
  allowParentAutoComplete: z.boolean().optional(),
  parentId: z.string().cuid().optional(),
  dependencies: z.array(z.string().cuid()).optional(),
});

export const bulkImportSchema = z.object({
  tasks: z.array(bulkImportTaskSchema),
});

// Export schemas
export const exportFormatSchema = z.enum(['json', 'csv']);

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

// Query parameter schemas
export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  parentId: z.string().cuid().nullable().optional(),
  q: z.string().optional(),
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default(1),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional().default(20),
});

export const exportQuerySchema = z.object({
  format: exportFormatSchema.optional().default('json'),
});

// Path parameter schemas
export const taskIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const dependencyIdParamSchema = z.object({
  id: z.string().cuid(),
  dependsOnTaskId: z.string().cuid(),
});

// Utility functions
export function validateId(id: string): string {
  const result = z.string().cuid().safeParse(id);
  if (!result.success) {
    throw new Error('Invalid ID format');
  }
  return result.data;
}

export function validateDate(date: string): Date {
  const result = z.string().datetime().safeParse(date);
  if (!result.success) {
    throw new Error('Invalid date format');
  }
  return new Date(result.data);
}
