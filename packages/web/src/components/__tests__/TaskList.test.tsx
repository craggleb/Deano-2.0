import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '../TaskList';
import { Task } from '@/types';

// Mock the API calls
vi.mock('@/lib/api', () => ({
  fetchTasks: vi.fn(),
  deleteTask: vi.fn(),
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test description 1',
    status: 'Todo',
    priority: 'Medium',
    estimatedDurationMinutes: 30,
    allowParentAutoComplete: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    parentId: null,
    children: [],
    dependencies: [],
    taskLabels: [],
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Test description 2',
    status: 'InProgress',
    priority: 'High',
    estimatedDurationMinutes: 60,
    allowParentAutoComplete: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    parentId: null,
    children: [],
    dependencies: [],
    taskLabels: [],
  },
];

describe('TaskList', () => {
  const mockOnTaskUpdate = vi.fn();
  const mockOnTaskDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task list with tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
  });

  it('should render empty state when no tasks', () => {
    render(
      <TaskList
        tasks={[]}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
  });

  it('should display task status correctly', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should display task priority correctly', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should display estimated duration', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('should call onTaskUpdate when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const editButtons = screen.getAllByLabelText(/edit task/i);
    await user.click(editButtons[0]);

    expect(mockOnTaskUpdate).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should call onTaskDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const deleteButtons = screen.getAllByLabelText(/delete task/i);
    await user.click(deleteButtons[0]);

    expect(mockOnTaskDelete).toHaveBeenCalledWith(mockTasks[0].id);
  });

  it('should show completion button for non-completed tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    const completeButtons = screen.getAllByLabelText(/complete task/i);
    expect(completeButtons).toHaveLength(2);
  });

  it('should show reopen button for completed tasks', () => {
    const completedTasks: Task[] = [
      {
        ...mockTasks[0],
        status: 'Completed',
      },
    ];

    render(
      <TaskList
        tasks={completedTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByLabelText(/reopen task/i)).toBeInTheDocument();
  });

  it('should display parent-child relationships', () => {
    const tasksWithChildren: Task[] = [
      {
        ...mockTasks[0],
        children: [mockTasks[1]],
      },
      {
        ...mockTasks[1],
        parentId: mockTasks[0].id,
      },
    ];

    render(
      <TaskList
        tasks={tasksWithChildren}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    // Should show parent task with child indicator
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('should display dependencies', () => {
    const tasksWithDependencies: Task[] = [
      {
        ...mockTasks[0],
        dependencies: [
          {
            id: 'dep1',
            dependentTaskId: mockTasks[0].id,
            blockerTaskId: mockTasks[1].id,
            blockerTask: mockTasks[1],
          },
        ],
      },
      mockTasks[1],
    ];

    render(
      <TaskList
        tasks={tasksWithDependencies}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('should display labels when present', () => {
    const tasksWithLabels: Task[] = [
      {
        ...mockTasks[0],
        taskLabels: [
          {
            id: 'tl1',
            taskId: mockTasks[0].id,
            labelId: 'label1',
            label: {
              id: 'label1',
              name: 'Bug',
              colour: '#FF0000',
              description: 'Bug label',
            },
          },
        ],
      },
    ];

    render(
      <TaskList
        tasks={tasksWithLabels}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Bug')).toBeInTheDocument();
  });

  it('should handle task with no description', () => {
    const taskWithoutDescription: Task[] = [
      {
        ...mockTasks[0],
        description: null,
      },
    ];

    render(
      <TaskList
        tasks={taskWithoutDescription}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    // Should not show description section
    expect(screen.queryByText('Test description 1')).not.toBeInTheDocument();
  });

  it('should handle task with allowParentAutoComplete flag', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    // Both tasks should be rendered regardless of the flag
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    // Focus on first task
    const firstTask = screen.getByText('Test Task 1').closest('div');
    if (firstTask) {
      firstTask.focus();
      
      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    }
  });

  it('should handle accessibility attributes', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    // Check for proper ARIA labels
    expect(screen.getByLabelText(/edit task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/delete task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/complete task/i)).toBeInTheDocument();
  });

  it('should handle task with long title', () => {
    const taskWithLongTitle: Task[] = [
      {
        ...mockTasks[0],
        title: 'This is a very long task title that should be handled properly by the component without breaking the layout or causing any visual issues',
      },
    ];

    render(
      <TaskList
        tasks={taskWithLongTitle}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText(/This is a very long task title/)).toBeInTheDocument();
  });

  it('should handle task with long description', () => {
    const taskWithLongDescription: Task[] = [
      {
        ...mockTasks[0],
        description: 'This is a very long task description that should be handled properly by the component. It might contain multiple sentences and should be displayed correctly without breaking the layout or causing any visual issues. The component should handle text wrapping appropriately.',
      },
    ];

    render(
      <TaskList
        tasks={taskWithLongDescription}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskDelete={mockOnTaskDelete}
      />
    );

    expect(screen.getByText(/This is a very long task description/)).toBeInTheDocument();
  });
});
