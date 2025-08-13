import { Router } from 'express';
import { TaskService } from '../services/taskService';
import { scheduleOptionsSchema } from '../lib/validation';
import { DependencyCycleError } from '../types';

const router = Router();
const taskService = new TaskService();

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkingHours:
 *       type: object
 *       properties:
 *         start:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Start time in HH:mm format
 *         end:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: End time in HH:mm format
 *         timezone:
 *           type: string
 *           description: Timezone (optional)
 *     ScheduleOptions:
 *       type: object
 *       properties:
 *         filter:
 *           type: object
 *           description: Task filter options
 *         workingHours:
 *           $ref: '#/components/schemas/WorkingHours'
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date for scheduling
 *         dailyCapacity:
 *           type: integer
 *           minimum: 1
 *           description: Daily capacity in minutes
 *         commit:
 *           type: boolean
 *           default: false
 *           description: Whether to commit the schedule to database
 *     ScheduledTask:
 *       type: object
 *       properties:
 *         taskId:
 *           type: string
 *           description: Task ID
 *         scheduledStart:
 *           type: string
 *           format: date-time
 *           description: Scheduled start time
 *         scheduledEnd:
 *           type: string
 *           format: date-time
 *           description: Scheduled end time
 *         constraints:
 *           type: object
 *           properties:
 *             blockers:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array of blocking task IDs
 *             dueViolation:
 *               type: boolean
 *               description: Whether the task violates its due date
 *             notes:
 *               type: array
 *               items:
 *                 type: string
 *               description: Additional notes about scheduling constraints
 *     SchedulePlan:
 *       type: object
 *       properties:
 *         tasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduledTask'
 *         summary:
 *           type: object
 *           properties:
 *             totalPlannedMinutes:
 *               type: integer
 *               description: Total minutes planned
 *             unplacedTasks:
 *               type: integer
 *               description: Number of tasks that couldn't be placed
 *             violations:
 *               type: integer
 *               description: Number of due date violations
 */

/**
 * @swagger
 * /api/schedule/plan:
 *   post:
 *     summary: Plan a schedule for tasks
 *     tags: [Scheduling]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleOptions'
 *     responses:
 *       200:
 *         description: Schedule planned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SchedulePlan'
 *       422:
 *         description: Dependency cycle detected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: DEPENDENCY_CYCLE
 *                     message:
 *                       type: string
 *                     details:
 *                       type: object
 *                       properties:
 *                         cycle:
 *                           type: array
 *                           items:
 *                             type: string
 */
router.post('/plan', async (req, res) => {
  try {
    const validatedData = scheduleOptionsSchema.parse(req.body);
    const schedule = await taskService.planSchedule(validatedData);
    
    res.json({
      data: schedule,
    });
  } catch (error) {
    if (error instanceof DependencyCycleError) {
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
});

export default router;
