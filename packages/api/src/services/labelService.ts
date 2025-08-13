import { PrismaClient } from '@prisma/client';
import { CreateLabelInput, UpdateLabelInput, LabelWithTaskCount } from '../types';

export class LabelService {
  constructor(private prisma: PrismaClient) {}

  async createLabel(input: CreateLabelInput) {
    return this.prisma.label.create({
      data: {
        name: input.name,
        colour: input.colour || '#3B82F6',
        description: input.description,
      },
    });
  }

  async getLabels() {
    return this.prisma.label.findMany({
      include: {
        _count: {
          select: {
            taskLabels: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }) as Promise<LabelWithTaskCount[]>;
  }

  async getLabelById(id: string) {
    return this.prisma.label.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taskLabels: true,
          },
        },
      },
    }) as Promise<LabelWithTaskCount | null>;
  }

  async updateLabel(id: string, input: UpdateLabelInput) {
    return this.prisma.label.update({
      where: { id },
      data: {
        name: input.name,
        colour: input.colour,
        description: input.description,
      },
    });
  }

  async deleteLabel(id: string) {
    // Check if label is used by any tasks
    const taskCount = await this.prisma.taskLabel.count({
      where: { labelId: id },
    });

    if (taskCount > 0) {
      throw new Error(`Cannot delete label that is used by ${taskCount} task(s)`);
    }

    return this.prisma.label.delete({
      where: { id },
    });
  }

  async assignLabelsToTask(taskId: string, labelIds: string[]) {
    // Remove existing labels
    await this.prisma.taskLabel.deleteMany({
      where: { taskId },
    });

    // Add new labels
    if (labelIds.length > 0) {
      await this.prisma.taskLabel.createMany({
        data: labelIds.map(labelId => ({
          taskId,
          labelId,
        })),
      });
    }
  }

  async getTaskLabels(taskId: string) {
    return this.prisma.taskLabel.findMany({
      where: { taskId },
      include: {
        label: true,
      },
    });
  }
}
