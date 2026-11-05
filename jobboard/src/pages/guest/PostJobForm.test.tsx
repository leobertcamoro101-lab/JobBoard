import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job, User } from '../../types';
import PostJobForm from './PostJobForm';

const mocks = vi.hoisted(() => ({
  createJob: vi.fn(),
  updateJob: vi.fn(),
  user: null as unknown,
}));

vi.mock('../../api/client', () => ({
  createJob: mocks.createJob,
  updateJob: mocks.updateJob,
}));
vi.mock('../../stores/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select({ user: mocks.user }),
}));

const employer = {
  id: 7,
  role: 'employer',
  email: 'hr@acme.test',
  employer_profile: { company_name: 'Acme Corp' },
} as unknown as User;

const job = {
  id: 12,
  employer_id: 7,
  title: 'Senior React Developer',
  company: 'Acme Corp',
  location: 'Cebu City',
  type: 'contract',
  category: 'Design',
  description: 'D'.repeat(120),
  requirements: null,
  salary_min: '50000.00',
  salary_max: null,
  currency: 'USD',
  apply_email: 'jobs@acme.test',
} as unknown as Job;

const renderForm = (props: { job?: Job } = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<PostJobForm {...props} />} />
          <Route path="/employers/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('PostJobForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = employer;
  });

  it('starts blank, with company and email from the employer, when no job is given', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: 'Post a Job' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Job Title/)).toHaveValue('');
    expect(screen.getByLabelText(/^Company/)).toHaveValue('Acme Corp');
    expect(screen.getByLabelText(/^Application Email/)).toHaveValue('hr@acme.test');
    expect(screen.queryByRole('link', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('is filled with the saved job on the very first render, with no waiting', () => {
    renderForm({ job });
    expect(screen.getByRole('heading', { name: 'Edit Job' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Job Title/)).toHaveValue('Senior React Developer');
    expect(screen.getByLabelText(/^Job Type/)).toHaveValue('contract');
    expect(screen.getByLabelText(/^Category/)).toHaveValue('Design');
    expect(screen.getByLabelText(/^Currency/)).toHaveValue('USD');
    expect(screen.getByLabelText(/^Min Salary/)).toHaveValue('50000');
    expect(screen.getByLabelText(/^Max Salary/)).toHaveValue('');
    expect(screen.getByLabelText(/^Requirements/)).toHaveValue('');
  });

  it('uses the job’s own values rather than the employer’s when editing', () => {
    renderForm({ job: { ...job, company: 'Other Co', apply_email: 'other@co.test' } });
    expect(screen.getByLabelText(/^Company/)).toHaveValue('Other Co');
    expect(screen.getByLabelText(/^Application Email/)).toHaveValue('other@co.test');
  });

  it('saves an edit against that job’s id', async () => {
    const user = userEvent.setup();
    mocks.updateJob.mockResolvedValue(job);
    renderForm({ job });
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(mocks.updateJob).toHaveBeenCalledWith(12, expect.objectContaining({ title: 'Senior React Developer' }));
    expect(mocks.createJob).not.toHaveBeenCalled();
  });
});
