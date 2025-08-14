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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isRecurring: false,
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
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    isRecurring: false,
    children: [],
    dependencies: [],
    taskLabels: [],
  },
];

describe('TaskList', () => {
  const mockOnTaskUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task list with tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
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
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
  });

  it('should display task status correctly', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should display task priority correctly', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should display estimated duration', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
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
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const editButtons = screen.getAllByLabelText(/edit task/i);
    await user.click(editButtons[0]);

    expect(mockOnTaskUpdate).toHaveBeenCalled();
  });

  it('should show completion button for non-completed tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const completeButtons = screen.getAllByLabelText(/complete task/i);
    expect(completeButtons).toHaveLength(2);
  });

  it('should show reopen button for completed tasks', () => {
    const completedTasks: Task[] = [
      {
        id: '3',
        title: 'Completed Task',
        description: 'A completed task',
        status: 'Completed',
        priority: 'Medium',
        estimatedDurationMinutes: 30,
        allowParentAutoComplete: false,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
        isRecurring: false,
        children: [],
        dependencies: [],
        taskLabels: [],
      },
    ];

    render(
      <TaskList
        tasks={completedTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const reopenButtons = screen.getAllByLabelText(/reopen task/i);
    expect(reopenButtons).toHaveLength(1);
  });

  it('should handle task status change', async () => {
    const user = userEvent.setup();
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const statusSelects = screen.getAllByLabelText(/status/i);
    await user.selectOptions(statusSelects[0], 'Completed');

    expect(mockOnTaskUpdate).toHaveBeenCalled();
  });

  it('should handle task priority change', async () => {
    const user = userEvent.setup();
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    const prioritySelects = screen.getAllByLabelText(/priority/i);
    await user.selectOptions(prioritySelects[0], 'High');

    expect(mockOnTaskUpdate).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(
      <TaskList
        tasks={[]}
        loading={true}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle task with dependencies', () => {
    const tasksWithDependencies: Task[] = [
      {
        ...mockTasks[0],
        dependencies: [
          {
            id: 'dep-1',
            taskId: '1',
            dependsOnTaskId: '2',
            createdAt: '2024-01-01T00:00:00.000Z',
            dependentTask: mockTasks[0],
            blockerTask: mockTasks[1],
          },
        ],
      },
    ];

    render(
      <TaskList
        tasks={tasksWithDependencies}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/dependencies/i)).toBeInTheDocument();
  });

  it('should handle task with labels', () => {
    const tasksWithLabels: Task[] = [
      {
        ...mockTasks[0],
        taskLabels: [
          {
            id: 'label-1',
            taskId: '1',
            labelId: 'label-1',
            createdAt: '2024-01-01T00:00:00.000Z',
            label: {
              id: 'label-1',
              name: 'Test Label',
              colour: '#ff0000',
              description: 'A test label',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      },
    ];

    render(
      <TaskList
        tasks={tasksWithLabels}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should handle task with null description', () => {
    const tasksWithNullDescription: Task[] = [
      {
        ...mockTasks[0],
        description: undefined,
      },
    ];

    render(
      <TaskList
        tasks={tasksWithNullDescription}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Test description 1')).not.toBeInTheDocument();
  });

  it('should handle task with due date', () => {
    const tasksWithDueDate: Task[] = [
      {
        ...mockTasks[0],
        dueAt: '2024-01-15T17:00:00.000Z',
      },
    ];

    render(
      <TaskList
        tasks={tasksWithDueDate}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it('should handle overdue tasks', () => {
    const overdueTasks: Task[] = [
      {
        ...mockTasks[0],
        dueAt: '2024-01-01T17:00:00.000Z', // Past date
      },
    ];

    render(
      <TaskList
        tasks={overdueTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('should handle task with children', () => {
    const tasksWithChildren: Task[] = [
      {
        ...mockTasks[0],
        children: [
          {
            id: 'child-1',
            title: 'Child Task',
            description: 'A child task',
            status: 'Todo',
            priority: 'Low',
            estimatedDurationMinutes: 15,
            allowParentAutoComplete: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            isRecurring: false,
            children: [],
            dependencies: [],
            taskLabels: [],
          },
        ],
      },
    ];

    render(
      <TaskList
        tasks={tasksWithChildren}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/subtasks/i)).toBeInTheDocument();
  });

  it('should handle task with scheduled times', () => {
    const scheduledTasks: Task[] = [
      {
        ...mockTasks[0],
        scheduledStart: '2024-01-15T09:00:00.000Z',
        scheduledEnd: '2024-01-15T10:00:00.000Z',
      },
    ];

    render(
      <TaskList
        tasks={scheduledTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
  });

  it('should handle recurring tasks', () => {
    const recurringTasks: Task[] = [
      {
        ...mockTasks[0],
        isRecurring: true,
        recurrencePattern: '{"type":"Daily","interval":1,"startDate":"2024-01-01"}',
        nextRecurrenceDate: '2024-01-16T00:00:00.000Z',
      },
    ];

    render(
      <TaskList
        tasks={recurringTasks}
        loading={false}
        onTaskUpdate={mockOnTaskUpdate}
      />
    );

    expect(screen.getByText(/recurring/i)).toBeInTheDocument();
  });
});
