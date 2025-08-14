export type TaskStatus = 'Todo' | 'InProgress' | 'Blocked' | 'Completed' | 'Canceled';
export type Priority = 'Low' | 'Medium' | 'High';
export type RecurrenceType = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';

export interface Label {
  id: string;
  name: string;
  colour: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    taskLabels: number;
  };
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  createdAt: string;
  label: Label;
}

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number;
  startDate: string;
  endDate?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  customPattern?: string;
}

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
  // Recurring task fields
  isRecurring: boolean;
  recurrencePattern?: string;
  nextRecurrenceDate?: string;
  originalTaskId?: string;
  children?: Task[];
  parent?: Task | null;
  dependencies?: DependencyWithTask[];
  blockingTasks?: DependencyWithTask[];
  taskLabels?: TaskLabel[];
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
  labelIds?: string[];
  // Recurring task fields
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  originalTaskId?: string;
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
  labelIds?: string[];
  // Recurring task fields
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern | null;
  originalTaskId?: string;
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
  dateRange?: 'today' | 'overdue' | 'thisWeek' | 'thisMonth' | 'custom';
  startDate?: string;
  endDate?: string;
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
