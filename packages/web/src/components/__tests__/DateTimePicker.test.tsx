import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DateTimePicker from '../DateTimePicker';

describe('DateTimePicker', () => {
  const mockOnChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders date and time inputs', () => {
    render(
      <DateTimePicker
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('displays validation error when both date and time are required', () => {
    render(
      <DateTimePicker
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Initially should show error for missing date/time
    expect(screen.getByText('Both date and time are required')).toBeInTheDocument();
    expect(mockOnValidationChange).toHaveBeenCalledWith(false);
  });

  it('validates date and time inputs correctly', () => {
    render(
      <DateTimePicker
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const dateInput = screen.getAllByRole('textbox')[0];
    const timeInput = screen.getAllByRole('textbox')[1];

    // Set valid date and time
    fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });

    // Should call onChange with valid ISO string
    expect(mockOnChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
    expect(mockOnValidationChange).toHaveBeenCalledWith(true);
  });

  it('displays external error message', () => {
    const errorMessage = 'External validation error';
    render(
      <DateTimePicker
        value=""
        onChange={mockOnChange}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('applies error styling when there is an error', () => {
    render(
      <DateTimePicker
        value=""
        onChange={mockOnChange}
        error="Test error"
      />
    );

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveClass('border-danger-500');
    });
  });
});
