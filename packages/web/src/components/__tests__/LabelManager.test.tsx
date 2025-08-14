import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LabelManager from '../LabelManager';

// Mock the fetch API
global.fetch = vi.fn();

const mockLabels = [
  {
    id: '1',
    name: 'Bug',
    colour: '#FF0000',
    description: 'Bug label',
  },
  {
    id: '2',
    name: 'Feature',
    colour: '#00FF00',
    description: 'Feature label',
  },
];

describe('LabelManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockLabels }),
    });
  });

  it('should show edit buttons by default', async () => {
    render(<LabelManager />);
    
    // Wait for labels to load
    await screen.findByText('Bug');
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should hide edit buttons when showEditButtons is false', async () => {
    render(<LabelManager showEditButtons={false} />);
    
    // Wait for labels to load
    await screen.findByText('Bug');
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should show header by default', async () => {
    render(<LabelManager />);
    
    expect(screen.getByText('Labels')).toBeInTheDocument();
  });

  it('should hide header when showHeader is false', async () => {
    render(<LabelManager showHeader={false} />);
    
    expect(screen.queryByText('Labels')).not.toBeInTheDocument();
  });

  it('should show create button by default', async () => {
    render(<LabelManager />);
    
    expect(screen.getByText('Create Label')).toBeInTheDocument();
  });

  it('should hide create button when showCreateButton is false', async () => {
    render(<LabelManager showCreateButton={false} />);
    
    expect(screen.queryByText('Create Label')).not.toBeInTheDocument();
  });
});
