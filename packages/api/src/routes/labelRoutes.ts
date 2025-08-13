import { Router } from 'express';
import { LabelService } from '../services/labelService';
import { prisma } from '../lib/database';
import { validateRequest } from '../lib/validation';
import { z } from 'zod';

const router = Router();
const labelService = new LabelService(prisma);

// Validation schemas
const createLabelSchema = z.object({
  name: z.string().min(1).max(100),
  colour: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().optional(),
});

const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  colour: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  description: z.string().optional(),
});

// Get all labels
router.get('/', async (_req, res) => {
  try {
    const labels = await labelService.getLabels();
    return res.json({ data: labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return res.status(500).json({ error: { message: 'Failed to fetch labels' } });
  }
});

// Get label by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const label = await labelService.getLabelById(id);
    
    if (!label) {
      return res.status(404).json({ error: { message: 'Label not found' } });
    }
    
    return res.json({ data: label });
  } catch (error) {
    console.error('Error fetching label:', error);
    return res.status(500).json({ error: { message: 'Failed to fetch label' } });
  }
});

// Create new label
router.post('/', validateRequest(createLabelSchema), async (req, res) => {
  try {
    const label = await labelService.createLabel(req.body);
    return res.status(201).json({ data: label });
  } catch (error) {
    console.error('Error creating label:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(400).json({ error: { message: 'Label name already exists' } });
    }
    return res.status(500).json({ error: { message: 'Failed to create label' } });
  }
});

// Update label
router.put('/:id', validateRequest(updateLabelSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const label = await labelService.updateLabel(id, req.body);
    return res.json({ data: label });
  } catch (error) {
    console.error('Error updating label:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: { message: 'Label not found' } });
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(400).json({ error: { message: 'Label name already exists' } });
    }
    return res.status(500).json({ error: { message: 'Failed to update label' } });
  }
});

// Delete label
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await labelService.deleteLabel(id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting label:', error);
    if (error instanceof Error && error.message.includes('Cannot delete label that is used by')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: { message: 'Label not found' } });
    }
    return res.status(500).json({ error: { message: 'Failed to delete label' } });
  }
});

export default router;
