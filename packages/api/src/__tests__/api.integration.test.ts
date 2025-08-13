import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '@/lib/database';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.taskLabel.deleteMany();
    await prisma.dependency.deleteMany();
    await prisma.task.deleteMany();
    await prisma.label.deleteMany();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.taskLabel.deleteMany();
    await prisma.dependency.deleteMany();
    await prisma.task.deleteMany();
    await prisma.label.deleteMany();
  });

  describe('Task Routes', () => {
    describe('POST /api/tasks', () => {
      it('should create a task with minimal data', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .send({
            title: 'Test Task',
          })
          .expect(201);

        expect(response.body.data).toMatchObject({
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
          allowParentAutoComplete: false,
        });
        expect(response.body.data.id).toBeDefined();
      });

      it('should create a task with all fields', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .send({
            title: 'Complete Task',
            description: 'A complete task description',
            priority: 'High',
            status: 'InProgress',
            estimatedDurationMinutes: 120,
            allowParentAutoComplete: true,
          })
          .expect(201);

        expect(response.body.data).toMatchObject({
          title: 'Complete Task',
          description: 'A complete task description',
          priority: 'High',
          status: 'InProgress',
          estimatedDurationMinutes: 120,
          allowParentAutoComplete: true,
        });
      });

      it('should return 500 for invalid title length (validation error)', async () => {
        await request(app)
          .post('/api/tasks')
          .send({
            title: 'ab', // Too short
          })
          .expect(500);
      });

      it('should return 500 for missing title (validation error)', async () => {
        await request(app)
          .post('/api/tasks')
          .send({
            description: 'No title provided',
          })
          .expect(500);
      });

      it('should return 422 for invalid date format (validation error)', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .send({
            title: 'Test Task with Invalid Date',
            dueAt: 'invalid-date-format',
          })
          .expect(422);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Validation failed');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'custom',
              message: 'Invalid date format. Please enter a valid date and time.',
            }),
          ])
        );
      });
    });

    describe('GET /api/tasks', () => {
      it('should return empty array when no tasks exist', async () => {
        const response = await request(app)
          .get('/api/tasks')
          .expect(200);

        expect(response.body.data).toEqual([]);
      });

      it('should return all tasks', async () => {
        // Create test tasks
        await prisma.task.createMany({
          data: [
            { title: 'Task 1' },
            { title: 'Task 2' },
            { title: 'Task 3' },
          ],
        });

        const response = await request(app)
          .get('/api/tasks')
          .expect(200);

        expect(response.body.data).toHaveLength(3);
        expect(response.body.data.map((task: any) => task.title)).toContain('Task 1');
        expect(response.body.data.map((task: any) => task.title)).toContain('Task 2');
        expect(response.body.data.map((task: any) => task.title)).toContain('Task 3');
      });

      it('should filter tasks by status', async () => {
        await prisma.task.createMany({
          data: [
            { title: 'Todo Task', status: 'Todo' },
            { title: 'In Progress Task', status: 'InProgress' },
            { title: 'Completed Task', status: 'Completed' },
          ],
        });

        const response = await request(app)
          .get('/api/tasks?status=InProgress')
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toBe('In Progress Task');
      });

      it('should filter tasks by priority', async () => {
        await prisma.task.createMany({
          data: [
            { title: 'Low Priority', priority: 'Low' },
            { title: 'Medium Priority', priority: 'Medium' },
            { title: 'High Priority', priority: 'High' },
          ],
        });

        const response = await request(app)
          .get('/api/tasks?priority=High')
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toBe('High Priority');
      });
    });

    describe('GET /api/tasks/:id', () => {
      it('should return task by id', async () => {
        const task = await prisma.task.create({
          data: { title: 'Test Task' },
        });

        const response = await request(app)
          .get(`/api/tasks/${task.id}`)
          .expect(200);

        expect(response.body.data).toMatchObject({
          id: task.id,
          title: 'Test Task',
        });
      });

      it('should return 500 for invalid task id format', async () => {
        await request(app)
          .get('/api/tasks/non-existent-id')
          .expect(500);
      });
    });

    describe('PUT /api/tasks/:id', () => {
          it('should update task', async () => {
      // Create task via API and immediately use it
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Title',
        })
        .expect(201);

      const task = createResponse.body.data;
      
      // Verify task was created
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Original Title');

      // Update the task
      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
          priority: 'High',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: task.id,
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'High',
      });
    });

      it('should return 404 for non-existent task', async () => {
        await request(app)
          .put('/api/tasks/non-existent-id')
          .send({ title: 'Updated Title' })
          .expect(404);
      });

      it('should return 422 for invalid date format when updating task', async () => {
        // Create a task first
        const createResponse = await request(app)
          .post('/api/tasks')
          .send({
            title: 'Test Task for Update',
          })
          .expect(201);

        const task = createResponse.body.data;

        // Try to update with invalid date
        const response = await request(app)
          .put(`/api/tasks/${task.id}`)
          .send({
            title: 'Updated Title',
            dueAt: 'invalid-date-format',
          })
          .expect(422);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toBe('Validation failed');
        expect(response.body.error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'custom',
              message: 'Invalid date format. Please enter a valid date and time.',
            }),
          ])
        );
      });
    });

    describe('DELETE /api/tasks/:id', () => {
      it('should delete task', async () => {
        const task = await prisma.task.create({
          data: { 
            title: 'Task to Delete',
            status: 'Todo',
            priority: 'Medium',
            estimatedDurationMinutes: 30,
          },
        });

        await request(app)
          .delete(`/api/tasks/${task.id}`)
          .expect(204);

        // Verify task is deleted
        await request(app)
          .get(`/api/tasks/${task.id}`)
          .expect(404);
      });

      it('should return 500 for invalid task id format', async () => {
        await request(app)
          .delete('/api/tasks/non-existent-id')
          .expect(500);
      });
    });

    describe('POST /api/tasks/:id/subtasks', () => {
      it('should add subtask to parent', async () => {
        const parent = await prisma.task.create({
          data: { 
            title: 'Parent Task',
            status: 'Todo',
            priority: 'Medium',
            estimatedDurationMinutes: 30,
          },
        });

        const response = await request(app)
          .post(`/api/tasks/${parent.id}/subtasks`)
          .send({
            title: 'Child Task',
          })
          .expect(201);

        expect(response.body.data).toMatchObject({
          title: 'Child Task',
          parentId: parent.id,
        });
      });

      it('should return 500 for invalid parent id format', async () => {
        await request(app)
          .post('/api/tasks/non-existent-id/subtasks')
          .send({ title: 'Child Task' })
          .expect(500);
      });
    });

    describe('POST /api/tasks/:id/complete', () => {
      it('should complete a task', async () => {
        const task = await prisma.task.create({
          data: { 
            title: 'Task to Complete',
            status: 'Todo',
            priority: 'Medium',
            estimatedDurationMinutes: 30,
          },
        });

        const response = await request(app)
          .post(`/api/tasks/${task.id}/complete`)
          .expect(200);

        expect(response.body.data.status).toBe('Completed');
      });

      it('should return 500 for invalid task id format', async () => {
        await request(app)
          .post('/api/tasks/non-existent-id/complete')
          .expect(500);
      });
    });

    describe('POST /api/tasks/:id/reopen', () => {
      it('should reopen a completed task', async () => {
        const task = await prisma.task.create({
          data: { 
            title: 'Completed Task',
            status: 'Completed',
          },
        });

        const response = await request(app)
          .post(`/api/tasks/${task.id}/reopen`)
          .expect(200);

        expect(response.body.data.status).toBe('Todo');
      });

      it('should return 500 for invalid task id format', async () => {
        await request(app)
          .post('/api/tasks/non-existent-id/reopen')
          .expect(500);
      });
    });

    describe('POST /api/tasks/:id/dependencies', () => {
      it('should add dependency between tasks', async () => {
        const blocker = await prisma.task.create({
          data: { title: 'Blocker Task' },
        });

        const dependent = await prisma.task.create({
          data: { title: 'Dependent Task' },
        });

        const response = await request(app)
          .post(`/api/tasks/${dependent.id}/dependencies`)
          .send({
            dependsOnTaskId: blocker.id,
          })
          .expect(201);

        expect(response.body.data).toMatchObject({
          message: 'Dependency added successfully',
        });
      });

      it('should return 500 for invalid dependent task id format', async () => {
        const blocker = await prisma.task.create({
          data: { 
            title: 'Blocker Task',
            status: 'Todo',
            priority: 'Medium',
            estimatedDurationMinutes: 30,
          },
        });

        await request(app)
          .post('/api/tasks/non-existent-id/dependencies')
          .send({ dependsOnTaskId: blocker.id })
          .expect(500);
      });

      it('should return 500 for invalid blocker task id format', async () => {
        const dependent = await prisma.task.create({
          data: { 
            title: 'Dependent Task',
            status: 'Todo',
            priority: 'Medium',
            estimatedDurationMinutes: 30,
          },
        });

        await request(app)
          .post(`/api/tasks/${dependent.id}/dependencies`)
          .send({ dependsOnTaskId: 'non-existent-id' })
          .expect(500);
      });
    });
  });

  describe('Label Routes', () => {
    describe('POST /api/labels', () => {
      it('should create a label with minimal data', async () => {
        const response = await request(app)
          .post('/api/labels')
          .send({
            name: 'Test Label',
          })
          .expect(201);

        expect(response.body.data).toMatchObject({
          name: 'Test Label',
          colour: '#3B82F6', // Default colour
        });
        expect(response.body.data.id).toBeDefined();
      });

      it('should create a label with all fields', async () => {
        const response = await request(app)
          .post('/api/labels')
          .send({
            name: 'Complete Label',
            colour: '#FF0000',
            description: 'A complete label description',
          })
          .expect(201);

        expect(response.body.data).toMatchObject({
          name: 'Complete Label',
          colour: '#FF0000',
          description: 'A complete label description',
        });
      });

      it('should return 400 for missing name', async () => {
        await request(app)
          .post('/api/labels')
          .send({
            colour: '#FF0000',
          })
          .expect(400);
      });
    });

    describe('GET /api/labels', () => {
      it('should return empty array when no labels exist', async () => {
        const response = await request(app)
          .get('/api/labels')
          .expect(200);

        expect(response.body.data).toEqual([]);
      });

      it('should return all labels ordered by name', async () => {
        await prisma.label.createMany({
          data: [
            { name: 'Zebra Label' },
            { name: 'Alpha Label' },
            { name: 'Beta Label' },
          ],
        });

        const response = await request(app)
          .get('/api/labels')
          .expect(200);

        expect(response.body.data).toHaveLength(3);
        expect(response.body.data[0].name).toBe('Alpha Label');
        expect(response.body.data[1].name).toBe('Beta Label');
        expect(response.body.data[2].name).toBe('Zebra Label');
      });
    });

    describe('GET /api/labels/:id', () => {
      it('should return label by id', async () => {
        const label = await prisma.label.create({
          data: { name: 'Test Label' },
        });

        const response = await request(app)
          .get(`/api/labels/${label.id}`)
          .expect(200);

        expect(response.body.data).toMatchObject({
          id: label.id,
          name: 'Test Label',
        });
      });

      it('should return 404 for non-existent label', async () => {
        await request(app)
          .get('/api/labels/non-existent-id')
          .expect(404);
      });
    });

    describe('PUT /api/labels/:id', () => {
      it('should update label', async () => {
        const label = await prisma.label.create({
          data: { name: 'Original Name' },
        });

        const response = await request(app)
          .put(`/api/labels/${label.id}`)
          .send({
            name: 'Updated Name',
            colour: '#00FF00',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body.data).toMatchObject({
          id: label.id,
          name: 'Updated Name',
          colour: '#00FF00',
          description: 'Updated description',
        });
      });

      it('should return 404 for non-existent label', async () => {
        await request(app)
          .put('/api/labels/non-existent-id')
          .send({ name: 'Updated Name' })
          .expect(404);
      });
    });

    describe('DELETE /api/labels/:id', () => {
      it('should delete label when not used by tasks', async () => {
        const label = await prisma.label.create({
          data: { name: 'Label to Delete' },
        });

        await request(app)
          .delete(`/api/labels/${label.id}`)
          .expect(204);

        // Verify label is deleted
        await request(app)
          .get(`/api/labels/${label.id}`)
          .expect(404);
      });

      it('should return 400 when label is used by tasks', async () => {
        const label = await prisma.label.create({
          data: { name: 'Used Label' },
        });

        const task = await prisma.task.create({
          data: { title: 'Test Task' },
        });

        await prisma.taskLabel.create({
          data: {
            taskId: task.id,
            labelId: label.id,
          },
        });

        await request(app)
          .delete(`/api/labels/${label.id}`)
          .expect(400);
      });

      it('should return 400 for invalid label id format', async () => {
        await request(app)
          .delete('/api/labels/non-existent-id')
          .expect(400);
      });
    });

    describe('POST /api/tasks/:id/labels', () => {
          it('should assign labels to task', async () => {
      // Create labels via API
      const label1Response = await request(app)
        .post('/api/labels')
        .send({ name: 'Label 1' })
        .expect(201);
      const label1 = label1Response.body.data;

      const label2Response = await request(app)
        .post('/api/labels')
        .send({ name: 'Label 2' })
        .expect(201);
      const label2 = label2Response.body.data;

      // Create task via API
      const taskResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' })
        .expect(201);
      const task = taskResponse.body.data;

      // Verify task was created
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');

      // Assign labels to task
      const response = await request(app)
        .post(`/api/tasks/${task.id}/labels`)
        .send({
          labelIds: [label1.id, label2.id],
        })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((tl: any) => tl.label.name)).toContain('Label 1');
      expect(response.body.data.map((tl: any) => tl.label.name)).toContain('Label 2');
    });

      it('should return 404 for non-existent task', async () => {
        const label = await prisma.label.create({ data: { name: 'Test Label' } });

        await request(app)
          .post('/api/tasks/non-existent-id/labels')
          .send({ labelIds: [label.id] })
          .expect(404);
      });
    });

    describe('GET /api/tasks/:id/labels', () => {
          it('should return labels for task', async () => {
      // Create label via API
      const labelResponse = await request(app)
        .post('/api/labels')
        .send({ name: 'Test Label' })
        .expect(201);
      const label = labelResponse.body.data;

      // Create task via API
      const taskResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' })
        .expect(201);
      const task = taskResponse.body.data;

      // Verify task was created
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');

      // Assign label via API
      await request(app)
        .post(`/api/tasks/${task.id}/labels`)
        .send({ labelIds: [label.id] })
        .expect(200);

      // Get labels for task
      const response = await request(app)
        .get(`/api/tasks/${task.id}/labels`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].label.name).toBe('Test Label');
    });

          it('should return empty array for task with no labels', async () => {
      // Create task via API
      const taskResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' })
        .expect(201);
      const task = taskResponse.body.data;

      // Verify task was created
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');

      // Get labels for task (should be empty)
      const response = await request(app)
        .get(`/api/tasks/${task.id}/labels`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

      it('should return 404 for invalid task id format', async () => {
        await request(app)
          .get('/api/tasks/non-existent-id/labels')
          .expect(404);
      });
    });
  });

  describe('Schedule Routes', () => {
    describe('POST /api/schedule/plan', () => {
      it('should plan schedule for tasks', async () => {
        const task1 = await prisma.task.create({
          data: {
            title: 'Task 1',
            estimatedDurationMinutes: 60,
          },
        });

        const task2 = await prisma.task.create({
          data: {
            title: 'Task 2',
            estimatedDurationMinutes: 30,
          },
        });

        await prisma.dependency.create({
          data: {
            dependentTask: {
              connect: { id: task2.id }
            },
            blockerTask: {
              connect: { id: task1.id }
            }
          },
        });

        const response = await request(app)
          .post('/api/schedule/plan')
          .send({
            workingHours: { start: '09:00', end: '17:30' },
            dailyCapacity: 480,
          })
          .expect(200);

        expect(response.body.data.tasks).toHaveLength(2);
        expect(response.body.data.summary.totalPlannedMinutes).toBe(90);
        expect(response.body.data.summary.violations).toBe(0);
      });

      it('should use default parameters when not provided', async () => {
        const task = await prisma.task.create({
          data: {
            title: 'Test Task',
            estimatedDurationMinutes: 30,
          },
        });

        const response = await request(app)
          .post('/api/schedule/plan')
          .expect(200);

        expect(response.body.data.tasks).toHaveLength(1);
        expect(response.body.data.summary.totalPlannedMinutes).toBe(30);
      });
    });
  });
});
