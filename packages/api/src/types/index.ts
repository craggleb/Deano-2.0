// Define enums locally to match Prisma schema
export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'InProgress',
  Blocked = 'Blocked',
  Completed = 'Completed',
  Canceled = 'Canceled'
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

// Define basic types that would normally come from Prisma
interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueAt?: Date | null;
  estimatedDurationMinutes: number;
  allowParentAutoComplete: boolean;
  parentId?: string | null;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Dependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
}

interface Label {
  id: string;
  name: string;
  colour: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  createdAt: Date;
}

// Base types
export type TaskWithRelations = Task & {
  children?: TaskWithRelations[];
  parent?: TaskWithRelations | null;
  dependencies?: DependencyWithTask[];
  blockingTasks?: DependencyWithTask[];
  taskLabels?: TaskLabelWithLabel[];
};

export type DependencyWithTask = Dependency & {
  dependentTask: Task;
  blockerTask: Task;
};

export type TaskLabelWithLabel = TaskLabel & {
  label: Label;
};

export type LabelWithTaskCount = Label & {
  _count: {
    taskLabels: number;
  };
};

// Input types
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: Date;
  estimatedDurationMinutes?: number;
  allowParentAutoComplete?: boolean;
  parentId?: string;
  labelIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: Date | null;
  estimatedDurationMinutes?: number;
  allowParentAutoComplete?: boolean;
  parentId?: string | null;
  labelIds?: string[];
}

export interface CreateLabelInput {
  name: string;
  colour?: string;
  description?: string;
}

export interface UpdateLabelInput {
  name?: string;
  colour?: string;
  description?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  parentId?: string | null;
  labelIds?: string[];
  q?: string;
  page?: number;
  limit?: number;
}

export interface WorkingHours {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  timezone?: string;
}

export interface ScheduleOptions {
  filter?: Partial<TaskFilter>;
  workingHours?: WorkingHours;
  startDate?: Date;
  dailyCapacity?: number; // in minutes
  commit?: boolean;
}

export interface ScheduledTask {
  taskId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  constraints: {
    blockers: string[];
    dueViolation: boolean;
    notes: string[];
  };
}

export interface SchedulePlan {
  tasks: ScheduledTask[];
  summary: {
    totalPlannedMinutes: number;
    unplacedTasks: number;
    violations: number;
  };
}

export interface CompleteTaskOptions {
  mode?: 'normal' | 'forceParentAutoComplete';
}

export interface BulkImportTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: Date;
  estimatedDurationMinutes?: number;
  allowParentAutoComplete?: boolean;
  parentId?: string;
  dependencies?: string[]; // array of task IDs this task depends on
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public code: string = 'BUSINESS_RULE_VIOLATION',
    public details?: any
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string = 'VALIDATION_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DependencyCycleError extends Error {
  constructor(
    message: string,
    public cycle: string[]
  ) {
    super(message);
    this.name = 'DependencyCycleError';
  }
}

// Export types
export type ExportFormat = 'json' | 'csv';

// Auth types
export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}
