import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  addDependencySchema,
  setDependenciesSchema,
  completeTaskSchema,
  scheduleOptionsSchema,
  bulkImportSchema,
  exportQuerySchema,
  taskIdParamSchema,
  dependencyIdParamSchema
} from '../lib/validation';
import { BusinessRuleError, ValidationError, DependencyCycleError } from '../types';
import { ZodError } from 'zod';

const taskService = new TaskService();

export class TaskController {
  // Task CRUD operations
  async createTask(req: Request, res: Response) {
    try {
      const validatedData = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(validatedData);
      
      res.status(201).json({
        data: task,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(422).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else {
        console.error('Create task error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const validatedData = updateTaskSchema.parse(req.body);
      
      const task = await taskService.updateTask(id, validatedData);
      
      res.json({
        data: task,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else if (error instanceof BusinessRuleError) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else if (error instanceof DependencyCycleError) {
        res.status(422).json({
          error: {
            code: 'DEPENDENCY_CYCLE',
            message: error.message,
            details: { cycle: error.cycle },
          },
        });
      } else {
        console.error('Update task error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      await taskService.deleteTask(id);
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else if (error instanceof BusinessRuleError) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else {
        console.error('Delete task error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const task = await taskService.getTask(id);
      
      res.json({
        data: task,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else {
        console.error('Get task error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async listTasks(req: Request, res: Response) {
    try {
      const validatedQuery = taskQuerySchema.parse(req.query);
      const result = await taskService.listTasks(validatedQuery);
      
      res.json({
        data: result.tasks,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else {
        console.error('List tasks error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  // Subtask operations
  async addSubtask(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const validatedData = createTaskSchema.parse(req.body);
      
      // Set the parent ID for the subtask
      const subtaskData = {
        ...validatedData,
        parentId: id,
      };
      
      const task = await taskService.addSubtask(id, subtaskData);
      
      res.status(201).json({
        data: task,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else {
        console.error('Add subtask error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  // Dependency operations
  async addDependency(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const { dependsOnTaskId } = addDependencySchema.parse(req.body);
      
      await taskService.addDependency(id, dependsOnTaskId);
      
      res.status(201).json({
        data: { message: 'Dependency added successfully' },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else if (error instanceof BusinessRuleError) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else if (error instanceof DependencyCycleError) {
        res.status(422).json({
          error: {
            code: 'DEPENDENCY_CYCLE',
            message: error.message,
            details: { cycle: error.cycle },
          },
        });
      } else {
        console.error('Add dependency error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async removeDependency(req: Request, res: Response) {
    try {
      const { id, dependsOnTaskId } = dependencyIdParamSchema.parse(req.params);
      await taskService.removeDependency(id, dependsOnTaskId);
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else {
        console.error('Remove dependency error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async setDependencies(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const { dependsOnTaskIds } = setDependenciesSchema.parse(req.body);
      
      await taskService.setDependencies(id, dependsOnTaskIds);
      
      res.json({
        data: { message: 'Dependencies updated successfully' },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else if (error instanceof BusinessRuleError) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else if (error instanceof DependencyCycleError) {
        res.status(422).json({
          error: {
            code: 'DEPENDENCY_CYCLE',
            message: error.message,
            details: { cycle: error.cycle },
          },
        });
      } else {
        console.error('Set dependencies error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  // Task completion operations
  async completeTask(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const validatedData = completeTaskSchema.parse(req.body);
      
      const task = await taskService.completeTask(id, validatedData);
      
      res.json({
        data: task,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else if (error instanceof BusinessRuleError) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else {
        console.error('Complete task error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async reopenTask(req: Request, res: Response) {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const task = await taskService.reopenTask(id);
      
      res.json({
        data: task,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      } else if (error instanceof BusinessRuleError) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        });
      } else {
        console.error('Reopen task error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  // Scheduling operations
  async planSchedule(req: Request, res: Response) {
    try {
      const validatedData = scheduleOptionsSchema.parse(req.body);
      const schedule = await taskService.planSchedule(validatedData);
      
      res.json({
        data: schedule,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else if (error instanceof DependencyCycleError) {
        res.status(422).json({
          error: {
            code: 'DEPENDENCY_CYCLE',
            message: error.message,
            details: { cycle: error.cycle },
          },
        });
      } else {
        console.error('Plan schedule error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  // Bulk operations
  async bulkImport(req: Request, res: Response) {
    try {
      const validatedData = bulkImportSchema.parse(req.body);
      const tasks = await taskService.bulkImport(validatedData.tasks);
      
      res.status(201).json({
        data: tasks,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else {
        console.error('Bulk import error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async exportTasks(req: Request, res: Response) {
    try {
      const validatedData = exportQuerySchema.parse(req.query);
      const data = await taskService.exportTasks(validatedData.format);
      
      if (validatedData.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks.json"');
      }
      
      res.send(data);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      } else {
        console.error('Export tasks error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error',
          },
        });
      }
    }
  }

  async getTaskAnalytics(req: Request, res: Response) {
    try {
      const { date, days } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      const daysToLookBack = days ? parseInt(days as string) : 1;
      
      const analytics = await taskService.getTaskAnalytics(targetDate, daysToLookBack);
      
      res.json({
        data: analytics,
      });
    } catch (error) {
      console.error('Get task analytics error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }

  async orderTasks(req: Request, res: Response) {
    try {
      const { weights, horizonHours, overdueBoost, quickWinCapMins } = req.body;
      
      const config = {
        weights: weights || { U: 0.45, P: 0.35, B: 0.15, Q: 0.05 },
        horizonHours: horizonHours || 7 * 24,
        overdueBoost: overdueBoost || 0.20,
        quickWinCapMins: quickWinCapMins || 30,
      };
      
      const result = await taskService.orderTasks(config);
      
      // Convert Map to object for JSON serialization
      const taskScoresObj: Record<string, { score: number; urgency: number; priority: number; blocking: number; quickWin: number }> = {};
      result.taskScores.forEach((value, key) => {
        taskScoresObj[key] = value;
      });
      
      res.json({
        data: {
          orderedTaskIds: result.orderedTaskIds,
          taskScores: taskScoresObj,
          cycles: result.cycles,
        },
      });
    } catch (error) {
      console.error('Order tasks error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    }
  }
}
