import { render, screen } from '@testing-library/react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { MemoryRouter, type Location } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ApplyForm } from '../schemas/applySchema';
import type { User } from '../types';
import ApplicantIdentityField from './ApplicantIdentityField';

const location: Location = { pathname: '/jobs/1', search: '', hash: '', state: null, key: 'k' };

const applicant = (allowView: boolean) =>
  ({
    id: 1,
    role: 'applicant',
    name: 'Alex Applicant',
    email: 'alex@example.test',
    applicant_profile: { resume_url: '/storage/resumes/a.pdf', allow_view: allowView },
  }) as unknown as User;

const employer = { id: 2, role: 'employer', name: 'Emma', email: 'emma@example.test' } as unknown as User;

const Harness = ({ user, errors = {} }: { user: User | null; errors?: FieldErrors<ApplyForm> }) => {
  const { register } = useForm<ApplyForm>();
  return (
    <MemoryRouter>
      <ApplicantIdentityField
        user={user}
        location={location}
        register={register}
        errors={errors}
        inputClass={() => ''}
      />
    </MemoryRouter>
  );
};

describe('ApplicantIdentityField', () => {
  it('shows labelled name and email inputs to a guest, with a login link', () => {
    render(<Harness user={null} />);
    expect(screen.getByLabelText(/^Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/applicants');
  });

  it('ties a guest’s validation errors to their fields', () => {
    const errors = {
      name: { type: 'min', message: 'Name is required' },
      email: { type: 'invalid', message: 'Enter a valid email' },
    } as FieldErrors<ApplyForm>;
    render(<Harness user={null} errors={errors} />);

    const name = screen.getByLabelText(/^Full Name/);
    expect(name).toBeInvalid();
    expect(name).toHaveAccessibleDescription('Name is required');

    const email = screen.getByLabelText(/^Email/);
    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription('Enter a valid email');
  });

  it('shows a signed-in applicant who they are applying as, with no inputs', () => {
    render(<Harness user={applicant(true)} />);
    expect(screen.getByText('Applying as')).toBeInTheDocument();
    expect(screen.getByText('Alex Applicant')).toBeInTheDocument();
    expect(screen.getByText('alex@example.test')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Full Name/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });

  it('tells the applicant whether the employer will see their resume', () => {
    const { unmount } = render(<Harness user={applicant(true)} />);
    expect(screen.getByText(/will be visible to this employer/)).toBeInTheDocument();
    unmount();

    render(<Harness user={applicant(false)} />);
    expect(screen.getByText(/set to private/)).toBeInTheDocument();
  });

  it('treats a signed-in employer like a guest, without the login prompt', () => {
    render(<Harness user={employer} />);
    expect(screen.getByLabelText(/^Full Name/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });
});
