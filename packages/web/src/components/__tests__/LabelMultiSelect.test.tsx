import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LabelMultiSelect from '../LabelMultiSelect';

// Mock fetch
global.fetch = vi.fn();

const mockLabels = [
  {
    id: 'label1',
    name: 'Test Label 1',
    colour: '#3B82F6',
    description: 'Test description 1',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'label2',
    name: 'Test Label 2',
    colour: '#EF4444',
    description: 'Test description 2',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('LabelMultiSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder when no labels are selected', async () => {
    const mockOnSelectionChange = vi.fn();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockLabels }),
    });

    render(
      <LabelMultiSelect
        selectedLabelIds={[]}
        onSelectionChange={mockOnSelectionChange}
        placeholder="Select labels..."
      />
    );

    expect(screen.getByText('Select labels...')).toBeInTheDocument();
  });

  it('fetches and displays labels when dropdown is opened', async () => {
    const mockOnSelectionChange = vi.fn();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockLabels }),
    });

    render(
      <LabelMultiSelect
        selectedLabelIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Click to open dropdown
    fireEvent.click(screen.getByText('Select labels...'));

    await waitFor(() => {
      expect(screen.getByText('Test Label 1')).toBeInTheDocument();
      expect(screen.getByText('Test Label 2')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/labels');
  });

  it('displays selected labels with remove buttons', async () => {
    const mockOnSelectionChange = vi.fn();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockLabels }),
    });

    render(
      <LabelMultiSelect
        selectedLabelIds={['label1']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Label 1')).toBeInTheDocument();
    });
  });

  it('calls onSelectionChange when a label is clicked', async () => {
    const mockOnSelectionChange = vi.fn();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockLabels }),
    });

    render(
      <LabelMultiSelect
        selectedLabelIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Click to open dropdown
    fireEvent.click(screen.getByText('Select labels...'));

    await waitFor(() => {
      expect(screen.getByText('Test Label 1')).toBeInTheDocument();
    });

    // Click on a label to select it
    fireEvent.click(screen.getByText('Test Label 1'));

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['label1']);
  });

  it('handles API error gracefully', async () => {
    const mockOnSelectionChange = vi.fn();
    
    (fetch as any).mockRejectedValueOnce(new Error('API Error'));

    render(
      <LabelMultiSelect
        selectedLabelIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Click to open dropdown
    fireEvent.click(screen.getByText('Select labels...'));

    await waitFor(() => {
      expect(screen.getByText('No labels available')).toBeInTheDocument();
    });
  });
});
