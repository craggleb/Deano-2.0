import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTaskModal from '../CreateTaskModal';

// Mock the API calls
vi.mock('@/lib/api', () => ({
  createTask: vi.fn(),
  fetchLabels: vi.fn(),
}));

describe('CreateTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnTaskCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal with form fields', () => {
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estimated duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allow parent auto-complete/i)).toBeInTheDocument();
  });

  it('should render modal when component is mounted', () => {
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    // Should show validation error for missing title
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('should validate title length', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'ab'); // Too short

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockCreateTask = vi.fn().mockResolvedValue({
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      priority: 'High',
      estimatedDurationMinutes: 60,
      allowParentAutoComplete: true,
    });

    vi.mocked(require('@/lib/api').createTask).mockImplementation(mockCreateTask);

    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Fill in form
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const prioritySelect = screen.getByLabelText(/priority/i);
    const durationInput = screen.getByLabelText(/estimated duration/i);
    const autoCompleteCheckbox = screen.getByLabelText(/allow parent auto-complete/i);

    await user.type(titleInput, 'Test Task');
    await user.type(descriptionInput, 'Test Description');
    await user.selectOptions(prioritySelect, 'High');
    await user.clear(durationInput);
    await user.type(durationInput, '60');
    await user.click(autoCompleteCheckbox);

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        estimatedDurationMinutes: 60,
        allowParentAutoComplete: true,
      });
    });

    await waitFor(() => {
      expect(mockOnTaskCreated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle form submission error', async () => {
    const user = userEvent.setup();
    const mockCreateTask = vi.fn().mockRejectedValue(new Error('API Error'));

    vi.mocked(require('@/lib/api').createTask).mockImplementation(mockCreateTask);

    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Fill in form
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Test Task');

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error creating task/i)).toBeInTheDocument();
    });

    // Should not close modal or call onTaskCreated
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnTaskCreated).not.toHaveBeenCalled();
  });

  it('should set default values correctly', () => {
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const prioritySelect = screen.getByLabelText(/priority/i);
    const durationInput = screen.getByLabelText(/estimated duration/i);
    const autoCompleteCheckbox = screen.getByLabelText(/allow parent auto-complete/i);

    expect(prioritySelect).toHaveValue('Medium');
    expect(durationInput).toHaveValue('30');
    expect(autoCompleteCheckbox).not.toBeChecked();
  });

  it('should handle priority selection', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const prioritySelect = screen.getByLabelText(/priority/i);
    
    await user.selectOptions(prioritySelect, 'High');
    expect(prioritySelect).toHaveValue('High');

    await user.selectOptions(prioritySelect, 'Low');
    expect(prioritySelect).toHaveValue('Low');
  });

  it('should handle duration input validation', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const durationInput = screen.getByLabelText(/estimated duration/i);
    
    // Test negative value
    await user.clear(durationInput);
    await user.type(durationInput, '-10');

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/duration must be positive/i)).toBeInTheDocument();
    });
  });

  it('should handle description as optional field', async () => {
    const user = userEvent.setup();
    const mockCreateTask = vi.fn().mockResolvedValue({
      id: '1',
      title: 'Test Task',
      description: null,
    });

    vi.mocked(require('@/lib/api').createTask).mockImplementation(mockCreateTask);

    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Only fill title, leave description empty
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Test Task');

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Test Task',
        description: '',
        priority: 'Medium',
        estimatedDurationMinutes: 30,
        allowParentAutoComplete: false,
      });
    });
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    const titleInput = screen.getByLabelText(/title/i);
    titleInput.focus();

    // Test tab navigation
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/description/i));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText(/priority/i));
  });

  it('should handle escape key to close modal', async () => {
    const user = userEvent.setup();
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Press escape key
    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset form when modal is closed and reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Fill in form
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    await user.type(titleInput, 'Test Task');
    await user.type(descriptionInput, 'Test Description');

    // Close modal
    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);

    // Reopen modal
    rerender(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Form should be reset
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
  });

  it('should handle loading state during submission', async () => {
    const user = userEvent.setup();
    const mockCreateTask = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    vi.mocked(require('@/lib/api').createTask).mockImplementation(mockCreateTask);

    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Fill in form
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, 'Test Task');

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText(/creating/i)).toBeInTheDocument();
    });

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
  });

  it('should handle accessibility attributes', () => {
    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
      />
    );

    // Check for proper ARIA attributes
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
  });

  it('should pre-select parent task when parentTaskId is provided', async () => {
    const mockTasks = [
      { id: 'parent-1', title: 'Parent Task 1' },
      { id: 'parent-2', title: 'Parent Task 2' },
    ];

    // Mock the fetch call
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockTasks }),
    });

    render(
      <CreateTaskModal
        onClose={mockOnClose}
        onSubmit={mockOnTaskCreated}
        parentTaskId="parent-1"
      />
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
    });

    // Check that the parent task is pre-selected
    const parentSelect = screen.getByLabelText(/parent task/i);
    expect(parentSelect).toHaveValue('parent-1');
  });
});
