import { prisma } from '../lib/database';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilter,
  TaskWithRelations,
  CompleteTaskOptions,
  BulkImportTask,
  BusinessRuleError,
  DependencyCycleError,
  ValidationError,
  Priority,
  RecurrencePattern,
  RecurrenceType,
  TaskStatus
} from '../types';
import { LabelService } from './labelService';

import { addMinutes, addDays, startOfDay, isBefore, isAfter, addWeeks, addMonths, addYears } from 'date-fns';

export class TaskService {
  private labelService: LabelService;

  constructor() {
    this.labelService = new LabelService(prisma);
  }

  // Task CRUD operations
  async createTask(input: CreateTaskInput): Promise<TaskWithRelations> {
    const { labelIds, recurrencePattern, ...taskData } = input;
    
    // Handle recurring task fields
    const createData: any = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'Todo',
      priority: taskData.priority || 'Medium',
      dueAt: taskData.dueAt,
      estimatedDurationMinutes: taskData.estimatedDurationMinutes || 30,
      allowParentAutoComplete: taskData.allowParentAutoComplete || false,
      parentId: taskData.parentId,
      isRecurring: taskData.isRecurring || false,
    };
    
    if (recurrencePattern) {
      createData.recurrencePattern = JSON.stringify(recurrencePattern);
      // Calculate next recurrence date
      createData.nextRecurrenceDate = this.calculateNextRecurrenceDate(recurrencePattern, taskData.dueAt || new Date());
    }
    
    const task = await prisma.task.create({
      data: createData,
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Assign labels if provided
    if (labelIds && labelIds.length > 0) {
      await this.labelService.assignLabelsToTask(task.id, labelIds);
    }

    return task as TaskWithRelations;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<TaskWithRelations> {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!existingTask) {
      throw new ValidationError('Task not found');
    }

    // Validate parent assignment
    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw new BusinessRuleError('Task cannot be its own parent');
      }
      if (input.parentId) {
        const parent = await prisma.task.findUnique({
          where: { id: input.parentId },
          include: { children: true },
        });
        if (!parent) {
          throw new ValidationError('Parent task not found');
        }
        // Check for circular references
        if (await this.wouldCreateCycle(id, input.parentId)) {
          throw new DependencyCycleError('Setting this parent would create a circular reference', [id, input.parentId]);
        }
      }
    }

    const { labelIds, recurrencePattern, ...taskData } = input;

    // Handle recurring task fields
    const updateData: any = { ...taskData };
    
    if (input.isRecurring !== undefined) {
      updateData.isRecurring = input.isRecurring;
    }
    
    if (recurrencePattern !== undefined) {
      updateData.recurrencePattern = recurrencePattern ? JSON.stringify(recurrencePattern) : null;
    }

    // Track status changes for analytics
    const auditEntries: Array<{ fieldName: string; oldValue: string | null; newValue: string | null }> = [];
    
    if (input.status !== undefined && input.status !== existingTask.status) {
      auditEntries.push({
        fieldName: 'status',
        oldValue: existingTask.status,
        newValue: input.status,
      });
    }

    if (input.priority !== undefined && input.priority !== existingTask.priority) {
      auditEntries.push({
        fieldName: 'priority',
        oldValue: existingTask.priority,
        newValue: input.priority,
      });
    }

    if (input.title !== undefined && input.title !== existingTask.title) {
      auditEntries.push({
        fieldName: 'title',
        oldValue: existingTask.title,
        newValue: input.title,
      });
    }

    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Create audit entries for tracked changes
    if (auditEntries.length > 0) {
      await prisma.taskAudit.createMany({
        data: auditEntries.map(entry => ({
          taskId: id,
          fieldName: entry.fieldName,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
        })),
      });
    }

    // Update labels if provided
    if (labelIds !== undefined) {
      await this.labelService.assignLabelsToTask(id, labelIds);
    }

    // Fetch the updated task with labels
    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });

    return updatedTask as TaskWithRelations;
  }

  async deleteTask(id: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!task) {
      throw new ValidationError('Task not found');
    }

    // Check if task has children
    if (task.children.length > 0) {
      throw new BusinessRuleError('Cannot delete task with children. Delete children first or reassign them.');
    }

    await prisma.task.delete({
      where: { id },
    });
  }

  async getTask(id: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            children: true,
            dependencies: {
              include: {
                blockerTask: true,
              },
            },
            taskLabels: {
              include: {
                label: true,
              },
            },
          },
        },
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });

    if (!task) {
      throw new ValidationError('Task not found');
    }

    return task as TaskWithRelations;
  }

  async listTasks(filter: TaskFilter = {}): Promise<{
    tasks: TaskWithRelations[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, ...restFilter } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (restFilter.status) {
      where.status = restFilter.status;
    }
    if (restFilter.priority) {
      where.priority = restFilter.priority;
    }
    if (restFilter.parentId !== undefined) {
      where.parentId = restFilter.parentId;
    }
    if (restFilter.q) {
      where.OR = [
        { title: { contains: restFilter.q, mode: 'insensitive' } },
        { description: { contains: restFilter.q, mode: 'insensitive' } },
      ];
    }
    
    if (restFilter.labelIds && restFilter.labelIds.length > 0) {
      where.taskLabels = {
        some: {
          labelId: {
            in: restFilter.labelIds
          }
        }
      };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { dueAt: 'asc' },
          { createdAt: 'asc' },
        ],
        include: {
          children: true,
          parent: true,
          dependencies: {
            include: {
              blockerTask: true,
            },
          },
          blockingTasks: {
            include: {
              dependentTask: true,
            },
          },
          taskLabels: {
            include: {
              label: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks: tasks as TaskWithRelations[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Subtask operations
  async addSubtask(parentId: string, input: CreateTaskInput): Promise<TaskWithRelations> {
    const parent = await prisma.task.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new ValidationError('Parent task not found');
    }

    return this.createTask({
      ...input,
      parentId,
    });
  }

  // Dependency operations
  async addDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    if (taskId === dependsOnTaskId) {
      throw new BusinessRuleError('Task cannot depend on itself');
    }

    // Check if both tasks exist
    const [task, blocker] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.task.findUnique({ where: { id: dependsOnTaskId } }),
    ]);

    if (!task || !blocker) {
      throw new ValidationError('Task or blocker not found');
    }

    // Check for circular dependencies
    if (await this.wouldCreateCycle(taskId, dependsOnTaskId)) {
      throw new DependencyCycleError('Adding this dependency would create a cycle', [taskId, dependsOnTaskId]);
    }

    await prisma.dependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });
  }

  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await prisma.dependency.deleteMany({
      where: {
        taskId,
        dependsOnTaskId,
      },
    });
  }

  async setDependencies(taskId: string, dependsOnTaskIds: string[]): Promise<void> {
    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new ValidationError('Task not found');
    }

    // Remove self-dependencies
    const filteredDependencies = dependsOnTaskIds.filter(id => id !== taskId);
    
    if (filteredDependencies.length !== dependsOnTaskIds.length) {
      throw new BusinessRuleError('Task cannot depend on itself');
    }

    // Check for circular dependencies
    for (const blockerId of filteredDependencies) {
      if (await this.wouldCreateCycle(taskId, blockerId)) {
        throw new DependencyCycleError('Setting these dependencies would create a cycle', [taskId, blockerId]);
      }
    }

    // Transaction to replace all dependencies
    await prisma.$transaction(async (tx) => {
      // Remove existing dependencies
      await tx.dependency.deleteMany({
        where: { taskId },
      });

      // Add new dependencies
      if (filteredDependencies.length > 0) {
        await tx.dependency.createMany({
          data: filteredDependencies.map(dependsOnTaskId => ({
            taskId,
            dependsOnTaskId,
          })),
        });
      }
    });
  }

  // Task completion logic
  async completeTask(id: string, options: CompleteTaskOptions = {}): Promise<TaskWithRelations> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        children: {
          where: {
            status: {
              notIn: ['Completed', 'Canceled'],
            },
          },
        },
      },
    });

    if (!task) {
      throw new ValidationError('Task not found');
    }

    if (task.status === 'Completed') {
      throw new BusinessRuleError('Task is already completed');
    }

    // Check if task has incomplete children
    if (task.children.length > 0) {
      if (!task.allowParentAutoComplete && options.mode !== 'forceParentAutoComplete') {
        throw new BusinessRuleError(
          'Cannot complete parent task with incomplete children',
          'PARENT_CHILDREN_INCOMPLETE',
          { incompleteChildren: task.children.map(c => ({ id: c.id, title: c.title })) }
        );
      }

      // Auto-complete children if allowed
      if (task.allowParentAutoComplete || options.mode === 'forceParentAutoComplete') {
        await prisma.task.updateMany({
          where: {
            id: {
              in: task.children.map(c => c.id),
            },
            status: {
              notIn: ['Completed', 'Canceled'],
            },
          },
          data: {
            status: 'Completed',
          },
        });
      }
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: 'Completed' },
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Handle recurring task logic
    if (updatedTask.isRecurring && updatedTask.recurrencePattern) {
      try {
        const pattern: RecurrencePattern = JSON.parse(updatedTask.recurrencePattern);
        const nextDueDate = this.calculateNextValidRecurrenceDate(pattern, updatedTask.dueAt || new Date());

        // Check if we've reached the end date
        if (!pattern.endDate || isBefore(nextDueDate, pattern.endDate)) {
          // Create the next occurrence
          await this.createNextRecurrence(updatedTask as TaskWithRelations);
        }
      } catch (error) {
        console.error('Error handling recurring task completion:', error);
      }
    }

    return updatedTask as TaskWithRelations;
  }

  async reopenTask(id: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new ValidationError('Task not found');
    }

    if (task.status !== 'Completed') {
      throw new BusinessRuleError('Only completed tasks can be reopened');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: 'Todo' },
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
      },
    });

    return updatedTask as TaskWithRelations;
  }

  // Scheduling logic
  async planSchedule(options: {
    filter?: Partial<TaskFilter>;
    workingHours?: { start: string; end: string; timezone?: string };
    startDate?: Date;
    dailyCapacity?: number;
    commit?: boolean;
  } = {}): Promise<{
    tasks: Array<{
      taskId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      constraints: {
        blockers: string[];
        dueViolation: boolean;
        notes: string[];
      };
    }>;
    summary: {
      totalPlannedMinutes: number;
      unplacedTasks: number;
      violations: number;
    };
  }> {
    const {
      filter = {},
      workingHours = { start: '09:00', end: '17:30', timezone: 'UTC' },
      startDate = new Date(),
      dailyCapacity = 480, // 8 hours in minutes
      commit = false,
    } = options;

    // Get tasks to schedule
    const { tasks } = await this.listTasks({ ...filter, limit: 1000 });
    const tasksToSchedule = tasks.filter(t => 
      t.status === 'Todo' || t.status === 'InProgress'
    );

    if (tasksToSchedule.length === 0) {
      return {
        tasks: [],
        summary: { totalPlannedMinutes: 0, unplacedTasks: 0, violations: 0 },
      };
    }

    // Build dependency graph and detect cycles
    const dependencyGraph = this.buildDependencyGraph(tasksToSchedule);
    const cycle = this.detectCycle(dependencyGraph);
    if (cycle) {
      throw new DependencyCycleError('Dependency cycle detected', cycle);
    }

    // Topological sort
    const sortedTasks = this.topologicalSort(dependencyGraph, tasksToSchedule);

    // Schedule tasks
    const scheduledTasks: Array<{
      taskId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      constraints: {
        blockers: string[];
        dueViolation: boolean;
        notes: string[];
      };
    }> = [];

    let currentTime = this.roundToNextQuarterHour(startDate);
    let currentDayCapacity = dailyCapacity;
    let currentDay = startOfDay(currentTime);

    for (const task of sortedTasks) {
      const constraints = {
        blockers: [] as string[],
        dueViolation: false,
        notes: [] as string[],
      };

      // Check dependencies
      const blockers = dependencyGraph.get(task.id) || [];
      const lastBlockerEnd = blockers.length > 0
        ? Math.max(...blockers.map(blockerId => {
            const blocker = scheduledTasks.find(t => t.taskId === blockerId);
            return blocker ? blocker.scheduledEnd.getTime() : 0;
          }))
        : 0;

      if (lastBlockerEnd > 0) {
        currentTime = new Date(lastBlockerEnd);
        constraints.blockers = blockers;
      }

      // Check if task fits in current day
      const taskDuration = task.estimatedDurationMinutes;
      const workingStart = this.getWorkingStart(currentDay, workingHours);
      const workingEnd = this.getWorkingEnd(currentDay, workingHours);

      // Ensure we're within working hours
      if (isBefore(currentTime, workingStart)) {
        currentTime = workingStart;
      }

      if (isAfter(currentTime, workingEnd)) {
        // Move to next day
        currentDay = addDays(currentDay, 1);
        currentTime = workingStart;
        currentDayCapacity = dailyCapacity;
      }

      // Check daily capacity
      if (currentDayCapacity < taskDuration) {
        // Move to next day
        currentDay = addDays(currentDay, 1);
        currentTime = workingStart;
        currentDayCapacity = dailyCapacity;
      }

      const scheduledStart = currentTime;
      const scheduledEnd = addMinutes(currentTime, taskDuration);

      // Check due date violation
      if (task.dueAt && isAfter(scheduledEnd, task.dueAt)) {
        constraints.dueViolation = true;
        constraints.notes.push('Scheduled after due date');
      }

      // Check if parent has incomplete children
      if (task.parentId && !task.allowParentAutoComplete) {
        const parent = tasksToSchedule.find(t => t.id === task.parentId);
        if (parent && parent.children?.some(c => c.status !== 'Completed' && c.status !== 'Canceled')) {
          constraints.notes.push('Parent has incomplete children');
        }
      }

      scheduledTasks.push({
        taskId: task.id,
        scheduledStart,
        scheduledEnd,
        constraints,
      });

      // Update current time and capacity
      currentTime = scheduledEnd;
      currentDayCapacity -= taskDuration;
    }

    // Commit to database if requested
    if (commit) {
      await prisma.$transaction(async (tx) => {
        for (const scheduledTask of scheduledTasks) {
          await tx.task.update({
            where: { id: scheduledTask.taskId },
            data: {
              scheduledStart: scheduledTask.scheduledStart,
              scheduledEnd: scheduledTask.scheduledEnd,
            },
          });
        }
      });
    }

    const violations = scheduledTasks.filter(t => t.constraints.dueViolation).length;
    const totalPlannedMinutes = scheduledTasks.reduce((sum, t) => {
      const duration = (t.scheduledEnd.getTime() - t.scheduledStart.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);

    return {
      tasks: scheduledTasks,
      summary: {
        totalPlannedMinutes,
        unplacedTasks: tasksToSchedule.length - scheduledTasks.length,
        violations,
      },
    };
  }

  // Bulk operations
  async bulkImport(tasks: BulkImportTask[]): Promise<TaskWithRelations[]> {
    const importedTasks: TaskWithRelations[] = [];

    for (const taskData of tasks) {
      const { dependencies, ...taskInput } = taskData;
      
      const task = await this.createTask({
        ...taskInput,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : undefined,
      });

      // Add dependencies if specified
      if (dependencies && dependencies.length > 0) {
        for (const blockerId of dependencies) {
          try {
            await this.addDependency(task.id, blockerId);
          } catch (error) {
            // Log dependency errors but continue with import
            console.warn(`Failed to add dependency ${blockerId} to task ${task.id}:`, error);
          }
        }
      }

      importedTasks.push(task);
    }

    return importedTasks;
  }

  async exportTasks(format: 'json' | 'csv' = 'json'): Promise<string> {
    const { tasks } = await this.listTasks({ limit: 10000 });

    if (format === 'json') {
      return JSON.stringify(tasks, null, 2);
    } else {
      // Simple CSV export
      const headers = ['id', 'title', 'description', 'status', 'priority', 'dueAt', 'estimatedDurationMinutes', 'parentId'];
      const rows = tasks.map(task => [
        task.id,
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.dueAt?.toISOString() || '',
        task.estimatedDurationMinutes,
        task.parentId || '',
      ]);

      return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    }
  }

  // Private helper methods
  private async wouldCreateCycle(taskId: string, parentId: string): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = async (currentId: string): Promise<boolean> => {
      if (recursionStack.has(currentId)) {
        return true; // Cycle detected
      }
      if (visited.has(currentId)) {
        return false;
      }

      visited.add(currentId);
      recursionStack.add(currentId);

      // Check if current task would become a child of the target task
      if (currentId === parentId) {
        recursionStack.delete(currentId);
        return true;
      }

      // Check parent chain
      const taskResult = await prisma.task.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      const currentParentId = taskResult?.parentId;

      if (currentParentId && await dfs(currentParentId)) {
        recursionStack.delete(currentId);
        return true;
      }

      recursionStack.delete(currentId);
      return false;
    };

    return await dfs(taskId);
  }

  private buildDependencyGraph(tasks: TaskWithRelations[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const task of tasks) {
      const blockers = task.dependencies?.map(d => d.dependsOnTaskId) || [];
      graph.set(task.id, blockers);
    }
    
    return graph;
  }

  private detectCycle(graph: Map<string, string[]>): string[] | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string): string[] | null => {
      if (recursionStack.has(node)) {
        return [node];
      }
      if (visited.has(node)) {
        return null;
      }

      visited.add(node);
      recursionStack.add(node);

      const neighbours = graph.get(node) || [];
      for (const neighbour of neighbours) {
        const cycle = dfs(neighbour);
        if (cycle) {
          if (cycle[0] === node) {
            return cycle;
          } else {
            return [node, ...cycle];
          }
        }
      }

      recursionStack.delete(node);
      return null;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        const cycle = dfs(node);
        if (cycle) {
          return cycle;
        }
      }
    }

    return null;
  }

  private topologicalSort(graph: Map<string, string[]>, tasks: TaskWithRelations[]): TaskWithRelations[] {
    const visited = new Set<string>();
    const sorted: TaskWithRelations[] = [];

    const dfs = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);

      const blockers = graph.get(node) || [];
      for (const blocker of blockers) {
        dfs(blocker);
      }

      const task = tasks.find(t => t.id === node);
      if (task) {
        sorted.push(task);
      }
    };

    for (const node of graph.keys()) {
      dfs(node);
    }

    // Sort by priority, due date, and duration
    return sorted.sort((a, b) => {
      // Overdue first
      const now = new Date();
      const aOverdue = a.dueAt && isBefore(a.dueAt, now);
      const bOverdue = b.dueAt && isBefore(b.dueAt, now);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by due date
      if (a.dueAt && b.dueAt) {
        const dueCompare = a.dueAt.getTime() - b.dueAt.getTime();
        if (dueCompare !== 0) return dueCompare;
      } else if (a.dueAt) return -1;
      else if (b.dueAt) return 1;
      
      // Then by priority
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      const priorityCompare = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityCompare !== 0) return priorityCompare;
      
      // Then by duration (shorter first)
      const durationCompare = a.estimatedDurationMinutes - b.estimatedDurationMinutes;
      if (durationCompare !== 0) return durationCompare;
      
      // Finally by creation date
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private roundToNextQuarterHour(date: Date): Date {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const result = new Date(date);
    result.setMinutes(roundedMinutes, 0, 0);
    return result;
  }

  private getWorkingStart(day: Date, workingHours: { start: string; end: string; timezone?: string }): Date {
    const [hours, minutes] = workingHours.start.split(':').map(Number);
    const result = new Date(day);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private getWorkingEnd(day: Date, workingHours: { start: string; end: string; timezone?: string }): Date {
    const [hours, minutes] = workingHours.end.split(':').map(Number);
    const result = new Date(day);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  async getTaskAnalytics(targetDate: Date, daysToLookBack: number = 1) {
    const startOfTargetDate = startOfDay(targetDate);
    const endOfTargetDate = new Date(startOfTargetDate);
    endOfTargetDate.setDate(endOfTargetDate.getDate() + 1);
    
    const startOfLookbackPeriod = new Date(startOfTargetDate);
    startOfLookbackPeriod.setDate(startOfLookbackPeriod.getDate() - daysToLookBack);

    // Get tasks created in the target period
    const addedTasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: startOfTargetDate,
          lt: endOfTargetDate,
        },
      },
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get tasks completed in the target period
    const completedTasks = await prisma.task.findMany({
      where: {
        status: 'Completed',
        updatedAt: {
          gte: startOfTargetDate,
          lt: endOfTargetDate,
        },
      },
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get overdue tasks as of the target date
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: {
          not: 'Completed',
        },
        dueAt: {
          lt: startOfTargetDate,
        },
      },
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
      orderBy: {
        dueAt: 'asc',
      },
    });

    // Get actual status changes from audit trail
    const statusChangeAudits = await prisma.taskAudit.findMany({
      where: {
        fieldName: 'status',
        changedAt: {
          gte: startOfTargetDate,
          lt: endOfTargetDate,
        },
      },
      include: {
        task: {
          include: {
            children: true,
            parent: true,
            dependencies: {
              include: {
                blockerTask: true,
              },
            },
            blockingTasks: {
              include: {
                dependentTask: true,
              },
            },
            taskLabels: {
              include: {
                label: true,
              },
            },
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });

    return {
      date: startOfTargetDate.toISOString().split('T')[0],
      summary: {
        added: addedTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        statusChanged: statusChangeAudits.map(audit => ({
          task: audit.task,
          oldStatus: audit.oldValue || 'Unknown',
          newStatus: audit.newValue || 'Unknown',
        })),
      },
      stats: {
        totalAdded: addedTasks.length,
        totalCompleted: completedTasks.length,
        totalOverdue: overdueTasks.length,
        totalStatusChanges: statusChangeAudits.length,
      },
    };
  }

  // Task ordering algorithm
  async orderTasks(config: {
    weights?: { U: number; P: number; B: number; Q: number };
    horizonHours?: number;
    overdueBoost?: number;
    quickWinCapMins?: number;
  } = {}): Promise<{
    orderedTaskIds: string[];
    taskScores: Map<string, { score: number; urgency: number; priority: number; blocking: number; quickWin: number }>;
    cycles?: string[];
  }> {
    const {
      weights = { U: 0.45, P: 0.35, B: 0.15, Q: 0.05 },
      horizonHours = 7 * 24,
      overdueBoost = 0.20,
      quickWinCapMins = 30,
    } = config;

    const now = new Date();

    // Get all non-completed tasks for ordering algorithm
    const tasks = await prisma.task.findMany({
      where: {
        status: {
          notIn: ['Completed']
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueAt: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        children: true,
        parent: true,
        dependencies: {
          include: {
            blockerTask: true,
          },
        },
        blockingTasks: {
          include: {
            dependentTask: true,
          },
        },
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });
    const taskMap = new Map((tasks as TaskWithRelations[]).map(t => [t.id, t]));

    // 1) Normalize structure: make parents depend on all their subtasks
    for (const task of tasks) {
      if (task.children && task.children.length > 0) {
        for (const child of task.children) {
          // Add dependency: child depends on parent (only if it doesn't already exist)
          try {
            await this.addDependency(child.id, task.id);
          } catch (error) {
            // Ignore dependency cycle errors - the dependency might already exist
            if (error instanceof DependencyCycleError) {
              console.log(`Skipping dependency ${child.id} -> ${task.id} due to existing cycle`);
            } else {
              throw error;
            }
          }
        }
      }
    }

    // 2) Build graph and in-degrees
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();
    const allTaskIds = new Set<string>();

    // Initialize
    for (const task of tasks) {
      allTaskIds.add(task.id);
      graph.set(task.id, new Set());
      inDegree.set(task.id, 0);
    }

    // Build dependency edges
    for (const task of tasks) {
      const blockers = task.dependencies?.map(d => d.dependsOnTaskId) || [];
      for (const blockerId of blockers) {
        if (graph.has(blockerId)) {
          graph.get(blockerId)!.add(task.id);
          inDegree.set(task.id, inDegree.get(task.id)! + 1);
        }
      }
    }

    // 3) Precompute blocking impact via reverse topological longest-path
    const depth = this.longestDownstreamDepth(allTaskIds, graph);
    const maxDepth = Math.max(...Array.from(depth.values()), 1);

    // 4) Seed ready set (in-degree 0) with a max-heap by score
    const ready = new Set<string>();
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        ready.add(taskId);
      }
    }

    const orderedTaskIds: string[] = [];
    const taskScores = new Map<string, { score: number; urgency: number; priority: number; blocking: number; quickWin: number }>();
    let seen = 0;

    while (ready.size > 0) {
      // 5) Find the task with highest score
      let bestTaskId = '';
      let bestScore = -Infinity;
      let bestTieBreak: [number, number, number, string] = [Infinity, -Infinity, Infinity, ''];

      for (const taskId of ready) {
        const scoreResult = this.calculateTaskScore(taskId, taskMap.get(taskId)!, {
          weights,
          horizonHours,
          overdueBoost,
          quickWinCapMins,
          depth,
          maxDepth,
          now,
        });

        const [score, tieBreak] = scoreResult;
        taskScores.set(taskId, scoreResult[2]);

        if (score > bestScore || (score === bestScore && this.compareTieBreak(tieBreak, bestTieBreak) < 0)) {
          bestScore = score;
          bestTieBreak = tieBreak;
          bestTaskId = taskId;
        }
      }

      if (!bestTaskId) break;

      // Remove from ready set and add to ordered list
      ready.delete(bestTaskId);
      orderedTaskIds.push(bestTaskId);
      seen++;

      // 6) "Complete" id: unlock its dependents
      const dependents = graph.get(bestTaskId) || new Set();
      for (const dependentId of dependents) {
        const currentDegree = inDegree.get(dependentId)!;
        inDegree.set(dependentId, currentDegree - 1);
        if (currentDegree - 1 === 0) {
          ready.add(dependentId);
        }
      }
    }

    // 7) Cycle check
    if (seen < allTaskIds.size) {
      const cycles = Array.from(inDegree.entries())
        .filter(([_, degree]) => degree > 0)
        .map(([taskId, _]) => taskId);
      
      const sampleCycle = this.sampleCycle(cycles, graph);
      return {
        orderedTaskIds: [],
        taskScores,
        cycles: sampleCycle,
      };
    }

    return {
      orderedTaskIds,
      taskScores,
    };
  }

  private calculateTaskScore(
    taskId: string,
    task: TaskWithRelations,
    config: {
      weights: { U: number; P: number; B: number; Q: number };
      horizonHours: number;
      overdueBoost: number;
      quickWinCapMins: number;
      depth: Map<string, number>;
      maxDepth: number;
      now: Date;
    }
  ): [number, [number, number, number, string], { score: number; urgency: number; priority: number; blocking: number; quickWin: number }] {
    const { weights, horizonHours, overdueBoost, quickWinCapMins, depth, maxDepth, now } = config;

    const urgency = this.urgencyComponent(task.dueAt, now, horizonHours, overdueBoost);
    const priority = this.normalizePriority(task.priority);
    const blocking = maxDepth === 0 ? 0 : (depth.get(taskId) || 0) / maxDepth;
    const quickWin = this.quickWinComponent(task.estimatedDurationMinutes, quickWinCapMins);

    const score = weights.U * urgency + weights.P * priority + weights.B * blocking + weights.Q * quickWin;

    // Deterministic tie-breaks: earlier due, higher priority, shorter duration, id
    const tieBreak: [number, number, number, string] = [
      this.dueTimestampOrInfinity(task.dueAt),
      -this.priorityToNumber(task.priority),
      task.estimatedDurationMinutes || Infinity,
      taskId,
    ];

    return [score, tieBreak, { score, urgency, priority, blocking, quickWin }];
  }

  private urgencyComponent(dueAt: Date | null | undefined, now: Date, horizonHours: number, overdueBoost: number): number {
    if (!dueAt) return 0;
    
    if (dueAt <= now) {
      return 1.0 + overdueBoost;
    }
    
    const dtHours = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    const u = 1.0 - Math.max(0, Math.min(1, dtHours / horizonHours));
    return u;
  }

  private normalizePriority(priority: Priority): number {
    const priorityMap = { Low: 1, Medium: 2, High: 3 };
    const p = Math.max(1, Math.min(3, priorityMap[priority]));
    return (p - 1) / 2.0;
  }

  private priorityToNumber(priority: Priority): number {
    const priorityMap = { Low: 1, Medium: 2, High: 3 };
    return priorityMap[priority];
  }

  private quickWinComponent(durationMins: number, quickWinCapMins: number): number {
    if (!durationMins) return 0;
    const d = Math.max(1, Math.min(quickWinCapMins, durationMins));
    return 1.0 - (d / quickWinCapMins);
  }

  private dueTimestampOrInfinity(dueAt: Date | null | undefined): number {
    return dueAt ? dueAt.getTime() : Infinity;
  }

  private compareTieBreak(a: [number, number, number, string], b: [number, number, number, string]): number {
    for (let i = 0; i < 4; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  }

  private longestDownstreamDepth(allTaskIds: Set<string>, graph: Map<string, Set<string>>): Map<string, number> {
    const reverseGraph = this.reverseGraph(graph);
    const inDegreeRev = new Map<string, number>();
    const depth = new Map<string, number>();

    // Initialize
    for (const taskId of allTaskIds) {
      inDegreeRev.set(taskId, reverseGraph.get(taskId)?.size || 0);
      depth.set(taskId, 0);
    }

    // Topological sort on reverse graph
    const queue: string[] = [];
    for (const [taskId, degree] of inDegreeRev) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      const dependents = reverseGraph.get(node) || new Set();
      
      for (const dependent of dependents) {
        const currentDepth = depth.get(dependent) || 0;
        const newDepth = (depth.get(node) || 0) + 1;
        depth.set(dependent, Math.max(currentDepth, newDepth));
        
        const currentDegree = inDegreeRev.get(dependent)!;
        inDegreeRev.set(dependent, currentDegree - 1);
        if (currentDegree - 1 === 0) {
          queue.push(dependent);
        }
      }
    }

    return depth;
  }

  private reverseGraph(graph: Map<string, Set<string>>): Map<string, Set<string>> {
    const reverse = new Map<string, Set<string>>();
    
    for (const [u, dependents] of graph) {
      if (!reverse.has(u)) reverse.set(u, new Set());
      for (const v of dependents) {
        if (!reverse.has(v)) reverse.set(v, new Set());
        reverse.get(v)!.add(u);
      }
    }
    
    return reverse;
  }

  private sampleCycle(nodes: string[], graph: Map<string, Set<string>>): string[] {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const path: string[] = [];

    const dfs = (u: string): boolean => {
      visited.add(u);
      stack.add(u);
      path.push(u);
      
      const dependents = graph.get(u) || new Set();
      for (const v of dependents) {
        if (!nodes.includes(v)) continue;
        if (!visited.has(v)) {
          if (dfs(v)) return true;
        } else if (stack.has(v)) {
          path.push(v);
          return true;
        }
      }
      
      stack.delete(u);
      path.pop();
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node)) {
        if (dfs(node)) break;
      }
    }

    return this.pathToCycleString(path);
  }

  private pathToCycleString(path: string[]): string[] {
    if (path.length < 2) return path;
    
    // Find the cycle in the path
    const lastNode = path[path.length - 1];
    const cycleStart = path.indexOf(lastNode);
    
    if (cycleStart !== -1 && cycleStart < path.length - 1) {
      return path.slice(cycleStart);
    }
    
    return path;
  }

  // Recurring task methods
  private calculateNextRecurrenceDate(pattern: RecurrencePattern, currentDate: Date): Date {
    const { type, interval } = pattern;
    let nextDate = new Date(currentDate);

    switch (type) {
      case RecurrenceType.Daily:
        nextDate = addDays(currentDate, interval);
        break;
      case RecurrenceType.Weekly:
        nextDate = addWeeks(currentDate, interval);
        break;
      case RecurrenceType.Monthly:
        nextDate = addMonths(currentDate, interval);
        break;
      case RecurrenceType.Yearly:
        nextDate = addYears(currentDate, interval);
        break;
      case RecurrenceType.Custom:
        // For custom patterns, we'll use a simple daily interval for now
        nextDate = addDays(currentDate, interval);
        break;
    }

    return nextDate;
  }

  private calculateNextValidRecurrenceDate(pattern: RecurrencePattern, fromDate: Date): Date {
    const today = startOfDay(new Date());
    let nextDate = this.calculateNextRecurrenceDate(pattern, fromDate);

    // If the next recurrence would be overdue, keep calculating until we find a valid date
    while (isBefore(nextDate, today)) {
      nextDate = this.calculateNextRecurrenceDate(pattern, nextDate);
    }

    return nextDate;
  }

  private async createNextRecurrence(task: TaskWithRelations): Promise<TaskWithRelations | null> {
    if (!task.isRecurring || !task.recurrencePattern) {
      return null;
    }

    try {
      const pattern: RecurrencePattern = JSON.parse(task.recurrencePattern);
      const nextDueDate = this.calculateNextValidRecurrenceDate(pattern, task.dueAt || new Date());

      // Check if we've reached the end date
      if (pattern.endDate && isAfter(nextDueDate, pattern.endDate)) {
        return null;
      }

      // Create the next occurrence
      const nextTask = await this.createTask({
        title: task.title,
        description: task.description || undefined,
        status: TaskStatus.Todo,
        priority: task.priority,
        dueAt: nextDueDate,
        estimatedDurationMinutes: task.estimatedDurationMinutes,
        allowParentAutoComplete: task.allowParentAutoComplete,
        parentId: task.parentId || undefined,
        isRecurring: true,
        recurrencePattern: pattern,
        originalTaskId: task.originalTaskId || task.id,
      });

      return nextTask;
    } catch (error) {
      console.error('Error creating next recurrence:', error);
      return null;
    }
  }
}
