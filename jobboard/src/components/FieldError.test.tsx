import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FieldError, { fieldA11y } from './FieldError';

describe('fieldA11y', () => {
  it('marks the field invalid and points it at its message', () => {
    expect(fieldA11y('job-title', 'Required')).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'job-title-error',
    });
  });

  it('adds nothing when there is no message', () => {
    expect(fieldA11y('job-title')).toEqual({
      'aria-invalid': false,
      'aria-describedby': undefined,
    });
  });
});

describe('FieldError', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<FieldError id="x" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('gives the message the id the input points at', () => {
    render(<FieldError id="email" message="Enter a valid email" />);
    expect(screen.getByText('Enter a valid email')).toHaveAttribute('id', 'email-error');
  });

  it('announces itself only when asked to', () => {
    const { rerender } = render(<FieldError message="Bad file" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<FieldError alert message="Bad file" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Bad file');
  });

  it('compact mode drops the icon', () => {
    const { container, rerender } = render(<FieldError message="Oops" />);
    expect(container.querySelector('svg')).toBeInTheDocument();

    rerender(<FieldError compact message="Oops" />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('becomes the input’s accessible description', () => {
    render(
      <>
        <label htmlFor="e">Email</label>
        <input id="e" {...fieldA11y('e', 'Enter a valid email')} />
        <FieldError id="e" message="Enter a valid email" />
      </>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter a valid email');
  });
});
