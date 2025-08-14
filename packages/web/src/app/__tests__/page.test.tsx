import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../page';

// Mock the API calls
vi.mock('@/lib/api', () => ({
  fetchTasks: vi.fn(),
}));

// Mock the components
vi.mock('@/components/TaskList', () => ({
  default: ({ tasks }: { tasks: any[] }) => (
    <div data-testid="task-list">
      {tasks.map(task => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          {task.title} - {task.status}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/CreateTaskModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('@/components/LabelMultiSelect', () => ({
  default: () => <div data-testid="label-select" />,
}));

describe('HomePage - Completed Tasks Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch to return some test data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: '1',
            title: 'Task 1',
            status: 'Todo',
            priority: 'Medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId: null,
            children: [],
            dependencies: [],
            taskLabels: [],
          },
          {
            id: '2',
            title: 'Task 2',
            status: 'Completed',
            priority: 'High',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentId: null,
            children: [],
            dependencies: [],
            taskLabels: [],
          },
        ],
        pagination: {
          total: 2,
          totalPages: 1,
          page: 1,
        },
      }),
    });
  });

  it('should show "Hide Completed" when completed tasks are visible', async () => {
    render(<HomePage />);
    
    // Wait for the page to load
    await screen.findByTestId('task-list');
    
    // The button should show "Hide Completed" when showCompletedTasks is true (default)
    const toggleButton = screen.getByText('Hide Completed');
    expect(toggleButton).toBeInTheDocument();
    
    // Should show both tasks (including completed)
    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-2')).toBeInTheDocument();
  });

  it('should show "Show All" when completed tasks are hidden', async () => {
    render(<HomePage />);
    
    // Wait for the page to load
    await screen.findByTestId('task-list');
    
    // Click the toggle button to hide completed tasks
    const toggleButton = screen.getByText('Hide Completed');
    await userEvent.click(toggleButton);
    
    // The button should now show "Show All"
    expect(screen.getByText('Show All')).toBeInTheDocument();
    
    // Should only show non-completed tasks
    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.queryByTestId('task-2')).not.toBeInTheDocument();
  });

  it('should toggle between states correctly', async () => {
    render(<HomePage />);
    
    // Wait for the page to load
    await screen.findByTestId('task-list');
    
    // Initially should show "Hide Completed"
    expect(screen.getByText('Hide Completed')).toBeInTheDocument();
    
    // Click to hide completed tasks
    await userEvent.click(screen.getByText('Hide Completed'));
    expect(screen.getByText('Show All')).toBeInTheDocument();
    
    // Click to show all tasks again
    await userEvent.click(screen.getByText('Show All'));
    expect(screen.getByText('Hide Completed')).toBeInTheDocument();
  });
});
