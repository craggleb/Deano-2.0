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
  ValidationError
} from '../types';

import { addMinutes, addDays, startOfDay, isBefore, isAfter } from 'date-fns';

export class TaskService {
  // Task CRUD operations
  async createTask(input: CreateTaskInput): Promise<TaskWithRelations> {
    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status || 'Todo',
        priority: input.priority || 'Medium',
        dueAt: input.dueAt,
        estimatedDurationMinutes: input.estimatedDurationMinutes || 30,
        allowParentAutoComplete: input.allowParentAutoComplete || false,
        parentId: input.parentId,
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
      },
    });

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

    const task = await prisma.task.update({
      where: { id },
      data: input,
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

    return task as TaskWithRelations;
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
      },
    });

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
}
