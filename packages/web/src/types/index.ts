export type TaskStatus = 'Todo' | 'InProgress' | 'Blocked' | 'Completed' | 'Canceled';
export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueAt?: string;
  estimatedDurationMinutes: number;
  allowParentAutoComplete: boolean;
  parentId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  createdAt: string;
  updatedAt: string;
  children?: Task[];
  parent?: Task | null;
  dependencies?: DependencyWithTask[];
  blockingTasks?: DependencyWithTask[];
}

export interface DependencyWithTask {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: string;
  dependentTask: Task;
  blockerTask: Task;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: string;
  estimatedDurationMinutes?: number;
  allowParentAutoComplete?: boolean;
  parentId?: string;
  dependencies?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueAt?: string | null;
  estimatedDurationMinutes?: number;
  allowParentAutoComplete?: boolean;
  parentId?: string | null;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  parentId?: string | null;
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
  startDate?: string;
  dailyCapacity?: number; // in minutes
  commit?: boolean;
}

export interface ScheduledTask {
  taskId: string;
  scheduledStart: string;
  scheduledEnd: string;
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
