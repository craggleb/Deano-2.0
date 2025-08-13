import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LabelService } from '../labelService';
import { prisma } from '@/lib/database';
import { CreateLabelInput, UpdateLabelInput } from '@/types';

describe('LabelService', () => {
  let labelService: LabelService;

  beforeEach(async () => {
    labelService = new LabelService(prisma);
    // Clean up database before each test
    await prisma.taskLabel.deleteMany();
    await prisma.label.deleteMany();
    await prisma.task.deleteMany();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.taskLabel.deleteMany();
    await prisma.label.deleteMany();
    await prisma.task.deleteMany();
  });

  describe('createLabel', () => {
    it('should create a label with default colour', async () => {
      const input: CreateLabelInput = {
        name: 'Test Label',
        description: 'A test label',
      };

      const label = await labelService.createLabel(input);

      expect(label.name).toBe('Test Label');
      expect(label.description).toBe('A test label');
      expect(label.colour).toBe('#3B82F6'); // Default colour
      expect(label.id).toBeDefined();
    });

    it('should create a label with custom colour', async () => {
      const input: CreateLabelInput = {
        name: 'Custom Label',
        colour: '#FF0000',
        description: 'A custom coloured label',
      };

      const label = await labelService.createLabel(input);

      expect(label.name).toBe('Custom Label');
      expect(label.colour).toBe('#FF0000');
      expect(label.description).toBe('A custom coloured label');
    });

    it('should create a label without description', async () => {
      const input: CreateLabelInput = {
        name: 'Simple Label',
      };

      const label = await labelService.createLabel(input);

      expect(label.name).toBe('Simple Label');
      expect(label.description).toBeNull();
      expect(label.colour).toBe('#3B82F6');
    });
  });

  describe('getLabels', () => {
    it('should return all labels ordered by name', async () => {
      await labelService.createLabel({ name: 'Zebra Label' });
      await labelService.createLabel({ name: 'Alpha Label' });
      await labelService.createLabel({ name: 'Beta Label' });

      const labels = await labelService.getLabels();

      expect(labels).toHaveLength(3);
      expect(labels[0].name).toBe('Alpha Label');
      expect(labels[1].name).toBe('Beta Label');
      expect(labels[2].name).toBe('Zebra Label');
    });

    it('should include task count for each label', async () => {
      const label = await labelService.createLabel({ name: 'Test Label' });
      
      // Create a task and assign the label
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });
      
      await prisma.taskLabel.create({
        data: {
          taskId: task.id,
          labelId: label.id,
        },
      });

      const labels = await labelService.getLabels();
      const testLabel = labels.find(l => l.id === label.id);

      expect(testLabel).toBeDefined();
      expect(testLabel!._count.taskLabels).toBe(1);
    });

    it('should return empty array when no labels exist', async () => {
      const labels = await labelService.getLabels();

      expect(labels).toHaveLength(0);
    });
  });

  describe('getLabelById', () => {
    it('should return label by id', async () => {
      const createdLabel = await labelService.createLabel({
        name: 'Test Label',
        description: 'Test description',
      });

      const label = await labelService.getLabelById(createdLabel.id);

      expect(label).toBeDefined();
      expect(label!.name).toBe('Test Label');
      expect(label!.description).toBe('Test description');
    });

    it('should return null for non-existent label', async () => {
      const label = await labelService.getLabelById('non-existent-id');

      expect(label).toBeNull();
    });

    it('should include task count', async () => {
      const label = await labelService.createLabel({ name: 'Test Label' });
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });
      
      await prisma.taskLabel.create({
        data: {
          taskId: task.id,
          labelId: label.id,
        },
      });

      const foundLabel = await labelService.getLabelById(label.id);

      expect(foundLabel).toBeDefined();
      expect(foundLabel!._count.taskLabels).toBe(1);
    });
  });

  describe('updateLabel', () => {
    it('should update label name', async () => {
      const label = await labelService.createLabel({
        name: 'Old Name',
        description: 'Old description',
      });

      const updateInput: UpdateLabelInput = {
        name: 'New Name',
      };

      const updatedLabel = await labelService.updateLabel(label.id, updateInput);

      expect(updatedLabel.name).toBe('New Name');
      expect(updatedLabel.description).toBe('Old description'); // Should remain unchanged
    });

    it('should update label colour', async () => {
      const label = await labelService.createLabel({
        name: 'Test Label',
        colour: '#FF0000',
      });

      const updateInput: UpdateLabelInput = {
        colour: '#00FF00',
      };

      const updatedLabel = await labelService.updateLabel(label.id, updateInput);

      expect(updatedLabel.colour).toBe('#00FF00');
      expect(updatedLabel.name).toBe('Test Label'); // Should remain unchanged
    });

    it('should update label description', async () => {
      const label = await labelService.createLabel({
        name: 'Test Label',
        description: 'Old description',
      });

      const updateInput: UpdateLabelInput = {
        description: 'New description',
      };

      const updatedLabel = await labelService.updateLabel(label.id, updateInput);

      expect(updatedLabel.description).toBe('New description');
    });

    it('should update multiple fields at once', async () => {
      const label = await labelService.createLabel({
        name: 'Old Name',
        description: 'Old description',
        colour: '#FF0000',
      });

      const updateInput: UpdateLabelInput = {
        name: 'New Name',
        description: 'New description',
        colour: '#00FF00',
      };

      const updatedLabel = await labelService.updateLabel(label.id, updateInput);

      expect(updatedLabel.name).toBe('New Name');
      expect(updatedLabel.description).toBe('New description');
      expect(updatedLabel.colour).toBe('#00FF00');
    });

    it('should throw error for non-existent label', async () => {
      const updateInput: UpdateLabelInput = {
        name: 'New Name',
      };

      await expect(
        labelService.updateLabel('non-existent-id', updateInput)
      ).rejects.toThrow();
    });
  });

  describe('deleteLabel', () => {
    it('should delete label when not used by any tasks', async () => {
      const label = await labelService.createLabel({
        name: 'Test Label',
      });

      await labelService.deleteLabel(label.id);

      const deletedLabel = await labelService.getLabelById(label.id);
      expect(deletedLabel).toBeNull();
    });

    it('should throw error when label is used by tasks', async () => {
      const label = await labelService.createLabel({
        name: 'Test Label',
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

      await expect(
        labelService.deleteLabel(label.id)
      ).rejects.toThrow('Cannot delete label that is used by 1 task(s)');
    });

    it('should throw error for non-existent label', async () => {
      await expect(
        labelService.deleteLabel('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('assignLabelsToTask', () => {
    it('should assign labels to task', async () => {
      const label1 = await labelService.createLabel({ name: 'Label 1' });
      const label2 = await labelService.createLabel({ name: 'Label 2' });
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });

      await labelService.assignLabelsToTask(task.id, [label1.id, label2.id]);

      const taskLabels = await labelService.getTaskLabels(task.id);
      expect(taskLabels).toHaveLength(2);
      expect(taskLabels.map(tl => tl.label.name)).toContain('Label 1');
      expect(taskLabels.map(tl => tl.label.name)).toContain('Label 2');
    });

    it('should replace existing labels when assigning new ones', async () => {
      const label1 = await labelService.createLabel({ name: 'Label 1' });
      const label2 = await labelService.createLabel({ name: 'Label 2' });
      const label3 = await labelService.createLabel({ name: 'Label 3' });
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });

      // First assignment
      await labelService.assignLabelsToTask(task.id, [label1.id, label2.id]);
      
      // Second assignment should replace the first
      await labelService.assignLabelsToTask(task.id, [label3.id]);

      const taskLabels = await labelService.getTaskLabels(task.id);
      expect(taskLabels).toHaveLength(1);
      expect(taskLabels[0].label.name).toBe('Label 3');
    });

    it('should remove all labels when empty array is provided', async () => {
      const label = await labelService.createLabel({ name: 'Test Label' });
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });

      await prisma.taskLabel.create({
        data: {
          taskId: task.id,
          labelId: label.id,
        },
      });

      await labelService.assignLabelsToTask(task.id, []);

      const taskLabels = await labelService.getTaskLabels(task.id);
      expect(taskLabels).toHaveLength(0);
    });
  });

  describe('getTaskLabels', () => {
    it('should return labels for a task', async () => {
      const label1 = await labelService.createLabel({ name: 'Label 1' });
      const label2 = await labelService.createLabel({ name: 'Label 2' });
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });

      await prisma.taskLabel.createMany({
        data: [
          { taskId: task.id, labelId: label1.id },
          { taskId: task.id, labelId: label2.id },
        ],
      });

      const taskLabels = await labelService.getTaskLabels(task.id);

      expect(taskLabels).toHaveLength(2);
      expect(taskLabels.map(tl => tl.label.name)).toContain('Label 1');
      expect(taskLabels.map(tl => tl.label.name)).toContain('Label 2');
    });

    it('should return empty array for task with no labels', async () => {
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });

      const taskLabels = await labelService.getTaskLabels(task.id);

      expect(taskLabels).toHaveLength(0);
    });

    it('should include label details in response', async () => {
      const label = await labelService.createLabel({
        name: 'Test Label',
        colour: '#FF0000',
        description: 'Test description',
      });
      const task = await prisma.task.create({
        data: { 
          title: 'Test Task',
          status: 'Todo',
          priority: 'Medium',
          estimatedDurationMinutes: 30,
        },
      });

      await prisma.taskLabel.create({
        data: {
          taskId: task.id,
          labelId: label.id,
        },
      });

      const taskLabels = await labelService.getTaskLabels(task.id);

      expect(taskLabels).toHaveLength(1);
      expect(taskLabels[0].label.name).toBe('Test Label');
      expect(taskLabels[0].label.colour).toBe('#FF0000');
      expect(taskLabels[0].label.description).toBe('Test description');
    });
  });
});
