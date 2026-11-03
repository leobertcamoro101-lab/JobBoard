import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import FormField from './FormField';

describe('FormField', () => {
  it('labels the control, with no id supplied by the caller', () => {
    render(
      <FormField label="Job Title">
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText('Job Title')).toBeInTheDocument();
  });

  it('gives two fields different ids so the labels never cross over', () => {
    render(
      <>
        <FormField label="First">
          <input />
        </FormField>
        <FormField label="Second">
          <input />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });

  it('keeps an id the caller chose', () => {
    render(
      <FormField label="Email">
        <input id="signup-email" />
      </FormField>,
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'signup-email');
  });

  it('is valid and undescribed when there is no error or hint', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeValid();
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('marks the field invalid and ties the message to it', () => {
    render(
      <FormField label="Email" error="Enter a valid email">
        <input />
      </FormField>,
    );
    const input = screen.getByLabelText('Email');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter a valid email');
  });

  it('accepts a react-hook-form error object', () => {
    render(
      <FormField label="Email" error={{ message: 'The Email field is required' }}>
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('The Email field is required');
  });

  it('reads the hint with the field, and the hint stays when an error appears', () => {
    const { rerender } = render(
      <FormField label="Password" hint="At least 10 characters">
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 10 characters');

    rerender(
      <FormField label="Password" hint="At least 10 characters" error="Too short">
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 10 characters Too short');
    expect(screen.getByText('At least 10 characters')).toBeInTheDocument();
  });

  it('keeps a describedby the child already had', () => {
    render(
      <>
        <p id="extra">Extra note</p>
        <FormField label="Email" error="Bad">
          <input aria-describedby="extra" />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Extra note Bad');
  });

  it('works on selects and textareas too', () => {
    render(
      <>
        <FormField label="Type" error="Pick one">
          <select>
            <option value="">Choose</option>
          </select>
        </FormField>
        <FormField label="Description" error="Too short">
          <textarea />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText('Type')).toHaveAccessibleDescription('Pick one');
    expect(screen.getByLabelText('Description')).toHaveAccessibleDescription('Too short');
  });

  it('does not break react-hook-form’s register (ref and onChange still reach the input)', async () => {
    const onSubmit = vi.fn();
    const Form = () => {
      const { register, handleSubmit } = useForm<{ title: string }>();
      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Job Title">
            <input {...register('title')} />
          </FormField>
          <button>Save</button>
        </form>
      );
    };
    render(<Form />);
    await userEvent.setup().type(screen.getByLabelText('Job Title'), 'Engineer');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Engineer' }, expect.anything());
  });

  it('supports a control inside a wrapper by handing the attributes to a render function', () => {
    render(
      <FormField label="Password" id="pw" hint="Ten characters" error="Too short">
        {(a11y) => (
          <div>
            <input {...a11y} type="password" />
            <button type="button">Show</button>
          </div>
        )}
      </FormField>,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('id', 'pw');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Ten characters Too short');
  });

  it('uses the id prop over a generated one', () => {
    render(
      <FormField label="Email" id="chosen">
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'chosen');
  });

  it('uses the denser text style when size is compact', () => {
    render(
      <FormField label="Phone" size="compact" error="Required">
        <input />
      </FormField>,
    );
    expect(screen.getByText('Phone')).toHaveClass('text-xs');
    expect(screen.getByText('Required')).toHaveClass('text-xs');
  });
});
