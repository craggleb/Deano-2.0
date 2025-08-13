import { Router } from 'express';
import { TaskController } from '@/controllers/taskController';

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique task identifier
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         status:
 *           type: string
 *           enum: [Todo, InProgress, Blocked, Completed, Canceled]
 *           description: Task status
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *           description: Task priority
 *         dueAt:
 *           type: string
 *           format: date-time
 *           description: Task due date
 *         estimatedDurationMinutes:
 *           type: integer
 *           minimum: 0
 *           description: Estimated duration in minutes
 *         allowParentAutoComplete:
 *           type: boolean
 *           description: Whether completing parent auto-completes children
 *         parentId:
 *           type: string
 *           description: Parent task ID
 *         scheduledStart:
 *           type: string
 *           format: date-time
 *           description: Scheduled start time
 *         scheduledEnd:
 *           type: string
 *           format: date-time
 *           description: Scheduled end time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateTaskInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Todo, InProgress, Blocked, Completed, Canceled]
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *         dueAt:
 *           type: string
 *           format: date-time
 *         estimatedDurationMinutes:
 *           type: integer
 *           minimum: 0
 *         allowParentAutoComplete:
 *           type: boolean
 *         parentId:
 *           type: string
 *     UpdateTaskInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 200
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Todo, InProgress, Blocked, Completed, Canceled]
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *         dueAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         estimatedDurationMinutes:
 *           type: integer
 *           minimum: 0
 *         allowParentAutoComplete:
 *           type: boolean
 *         parentId:
 *           type: string
 *           nullable: true
 *     ApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           description: Response data
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             message:
 *               type: string
 *             details:
 *               description: Additional error details
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   get:
 *     summary: List tasks with filtering and pagination
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Todo, InProgress, Blocked, Completed, Canceled]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High]
 *         description: Filter by priority
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent task ID
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post('/', taskController.createTask.bind(taskController));
router.get('/', taskController.listTasks.bind(taskController));

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a specific task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskInput'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       409:
 *         description: Business rule violation
 *       422:
 *         description: Validation error or dependency cycle
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       409:
 *         description: Cannot delete task with children
 */
router.get('/:id', taskController.getTask.bind(taskController));
router.patch('/:id', taskController.updateTask.bind(taskController));
router.delete('/:id', taskController.deleteTask.bind(taskController));

/**
 * @swagger
 * /api/tasks/{id}/subtasks:
 *   post:
 *     summary: Add a subtask to a parent task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       201:
 *         description: Subtask created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Parent task not found
 */
router.post('/:id/subtasks', taskController.addSubtask.bind(taskController));

/**
 * @swagger
 * /api/tasks/{id}/dependencies:
 *   post:
 *     summary: Add a dependency to a task
 *     tags: [Dependencies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dependsOnTaskId
 *             properties:
 *               dependsOnTaskId:
 *                 type: string
 *                 description: ID of the task this task depends on
 *     responses:
 *       201:
 *         description: Dependency added successfully
 *       404:
 *         description: Task or blocker not found
 *       409:
 *         description: Self-dependency or business rule violation
 *       422:
 *         description: Dependency cycle detected
 *   put:
 *     summary: Set all dependencies for a task
 *     tags: [Dependencies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dependsOnTaskIds
 *             properties:
 *               dependsOnTaskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of task IDs this task depends on
 *     responses:
 *       200:
 *         description: Dependencies updated successfully
 *       404:
 *         description: Task not found
 *       409:
 *         description: Business rule violation
 *       422:
 *         description: Dependency cycle detected
 */
router.post('/:id/dependencies', taskController.addDependency.bind(taskController));
router.put('/:id/dependencies', taskController.setDependencies.bind(taskController));

/**
 * @swagger
 * /api/tasks/{id}/dependencies/{dependsOnTaskId}:
 *   delete:
 *     summary: Remove a specific dependency
 *     tags: [Dependencies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *       - in: path
 *         name: dependsOnTaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blocker task ID
 *     responses:
 *       204:
 *         description: Dependency removed successfully
 */
router.delete('/:id/dependencies/:dependsOnTaskId', taskController.removeDependency.bind(taskController));

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   post:
 *     summary: Complete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [normal, forceParentAutoComplete]
 *                 default: normal
 *                 description: Completion mode
 *     responses:
 *       200:
 *         description: Task completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       409:
 *         description: Cannot complete task with incomplete children
 */
router.post('/:id/complete', taskController.completeTask.bind(taskController));

/**
 * @swagger
 * /api/tasks/{id}/reopen:
 *   post:
 *     summary: Reopen a completed task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task reopened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       409:
 *         description: Only completed tasks can be reopened
 */
router.post('/:id/reopen', taskController.reopenTask.bind(taskController));

/**
 * @swagger
 * /api/tasks/bulkImport:
 *   post:
 *     summary: Bulk import tasks
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasks
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [Todo, InProgress, Blocked, Completed, Canceled]
 *                     priority:
 *                       type: string
 *                       enum: [Low, Medium, High]
 *                     dueAt:
 *                       type: string
 *                       format: date-time
 *                     estimatedDurationMinutes:
 *                       type: integer
 *                     allowParentAutoComplete:
 *                       type: boolean
 *                     parentId:
 *                       type: string
 *                     dependencies:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Tasks imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
router.post('/bulkImport', taskController.bulkImport.bind(taskController));

/**
 * @swagger
 * /api/tasks/export:
 *   get:
 *     summary: Export tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Tasks exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', taskController.exportTasks.bind(taskController));

export default router;
