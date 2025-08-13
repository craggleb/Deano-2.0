import { z } from 'zod';
import { TaskStatus, Priority } from '../types';

// Base schemas
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const prioritySchema = z.nativeEnum(Priority);

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  status: taskStatusSchema.optional().default(TaskStatus.Todo),
  priority: prioritySchema.optional().default(Priority.Medium),
  dueAt: z.string().optional().transform(val => {
    if (!val) return undefined;
    // Handle both ISO datetime strings and datetime-local input values
    try {
      return new Date(val);
    } catch {
      throw new Error('Invalid date format');
    }
  }),
  estimatedDurationMinutes: z.number().int().min(0).optional().default(30),
  allowParentAutoComplete: z.boolean().optional().default(false),
  parentId: z.string().cuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueAt: z.string().nullable().optional().transform(val => {
    if (!val) return null;
    // Handle both ISO datetime strings and datetime-local input values
    try {
      return new Date(val);
    } catch {
      throw new Error('Invalid date format');
    }
  }),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
  allowParentAutoComplete: z.boolean().optional(),
  parentId: z.string().cuid().nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  parentId: z.string().cuid().nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val),
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
  startDate: z.string().optional().transform(val => {
    if (!val) return undefined;
    try {
      return new Date(val);
    } catch {
      throw new Error('Invalid date format');
    }
  }),
  dailyCapacity: z.number().int().min(1).optional(),
  commit: z.boolean().optional().default(false),
});

// Bulk import schemas
export const bulkImportTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  dueAt: z.string().optional().transform(val => {
    if (!val) return undefined;
    try {
      return new Date(val);
    } catch {
      throw new Error('Invalid date format');
    }
  }),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
  allowParentAutoComplete: z.boolean().optional(),
  parentId: z.string().cuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
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
  page: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number()
  ]).pipe(z.number().int().min(1)).optional().default(1),
  limit: z.union([
    z.string().transform(val => parseInt(val, 10)),
    z.number()
  ]).pipe(z.number().int().min(1).max(100)).optional().default(20),
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
  try {
    return new Date(date);
  } catch {
    throw new Error('Invalid date format');
  }
}

// Middleware for validating request body
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
}
