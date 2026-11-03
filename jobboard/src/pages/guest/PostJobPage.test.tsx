import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job, User } from '../../types';
import PostJobPage from './PostJobPage';

const mocks = vi.hoisted(() => ({
  createJob: vi.fn(),
  updateJob: vi.fn(),
  getJob: vi.fn(),
  user: null as unknown,
}));

vi.mock('../../api/client', () => ({
  createJob: mocks.createJob,
  updateJob: mocks.updateJob,
  getJob: mocks.getJob,
}));
vi.mock('../../stores/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select({ user: mocks.user }),
}));

const employer = {
  id: 7,
  role: 'employer',
  email: 'hr@acme.test',
  employer_profile: { company_name: 'Acme Corp', company_website: null, company_logo_url: null },
} as unknown as User;

const job = {
  id: 12,
  employer_id: 7,
  title: 'Senior React Developer',
  company: 'Acme Corp',
  location: 'Cebu City',
  type: 'remote',
  category: 'Engineering',
  description: 'D'.repeat(120),
  requirements: 'TypeScript',
  salary_min: '50000.00',
  salary_max: '80000.00',
  currency: 'PHP',
  apply_email: 'jobs@acme.test',
} as unknown as Job;

const DESCRIPTION = 'We are looking for a thoughtful engineer to help build and grow our hiring platform. '.repeat(2);

const renderPage = (path = '/post') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/post" element={<PostJobPage />} />
          <Route path="/jobs/:id/edit" element={<PostJobPage />} />
          <Route path="/jobs/:id" element={<p>Job page</p>} />
          <Route path="/employers/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/^Job Title/), 'Backend Engineer');
  await user.type(screen.getByLabelText(/^Location/), 'Cebu City');
  await user.click(screen.getByLabelText(/^Job Description/));
  await user.paste(DESCRIPTION);
};

describe('PostJobPage, new job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = employer;
  });

  it('has a heading and a labelled control for every field', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Post a Job' })).toBeInTheDocument();
    for (const label of [
      /^Job Title/, /^Company/, /^Location/, /^Job Type/, /^Category/, /^Currency/,
      /^Min Salary/, /^Max Salary/, /^Job Description/, /^Requirements/, /^Application Email/,
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('never reuses an id, so each label points at its own field', () => {
    const { container } = renderPage();
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prefills the company and contact email from the signed-in employer', () => {
    renderPage();
    expect(screen.getByLabelText(/^Company/)).toHaveValue('Acme Corp');
    expect(screen.getByLabelText(/^Application Email/)).toHaveValue('hr@acme.test');
  });

  it('ties each required-field error to its field when submitted empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Post Job/ }));

    for (const [label, message] of [
      [/^Job Title/, 'Job title is required'],
      [/^Location/, 'Location is required'],
      [/^Job Description/, 'at least 100 characters'],
    ] as const) {
      const field = screen.getByLabelText(label);
      expect(field).toBeInvalid();
      expect(field).toHaveAccessibleDescription(expect.stringContaining(message));
    }
    expect(mocks.createJob).not.toHaveBeenCalled();
  });

  it('puts the error under the field it belongs to (the Location error is not on Company)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Post Job/ }));
    expect(screen.getByLabelText(/^Company/)).toBeValid();
    expect(screen.getByLabelText(/^Company/)).not.toHaveAttribute('aria-describedby');
  });

  it('shows the message for a malformed contact email instead of the browser tooltip', async () => {
    const user = userEvent.setup();
    renderPage();
    const email = screen.getByLabelText(/^Application Email/);
    await user.clear(email);
    await user.type(email, 'not-an-email');
    await user.click(screen.getByRole('button', { name: /Post Job/ }));

    expect(email).toHaveAccessibleDescription('Valid email required');
  });

  it('posts the job and opens its page', async () => {
    const user = userEvent.setup();
    mocks.createJob.mockResolvedValue({ id: 55 });
    renderPage();
    await fillValid(user);
    await user.selectOptions(screen.getByLabelText(/^Job Type/), 'remote');
    await user.type(screen.getByLabelText(/^Min Salary/), '50000');
    await user.click(screen.getByRole('button', { name: /Post Job/ }));

    expect(await screen.findByText('Job page')).toBeInTheDocument();
    expect(mocks.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Backend Engineer',
        company: 'Acme Corp',
        location: 'Cebu City',
        type: 'remote',
        category: 'Engineering',
        currency: 'PHP',
        salary_min: '50000',
        apply_email: 'hr@acme.test',
      }),
    );
  });

  it('shows the server’s message when posting fails, and stays on the form', async () => {
    const user = userEvent.setup();
    mocks.createJob.mockRejectedValue({ response: { data: { message: 'Only employers can post jobs.' } } });
    renderPage();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Post Job/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only employers can post jobs.');
    expect(screen.queryByText('Job page')).not.toBeInTheDocument();
  });

  it('falls back to a generic message', async () => {
    const user = userEvent.setup();
    mocks.createJob.mockRejectedValue(new Error('network'));
    renderPage();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Post Job/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to post job. Please try again.');
  });

  it('disables the button while posting', async () => {
    const user = userEvent.setup();
    mocks.createJob.mockReturnValue(new Promise(() => {}));
    renderPage();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /Post Job/ }));
    expect(await screen.findByRole('button', { name: 'Posting...' })).toBeDisabled();
  });
});

describe('PostJobPage, editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = employer;
    mocks.getJob.mockResolvedValue(job);
  });

  it('fills the form from the saved job', async () => {
    renderPage('/jobs/12/edit');
    expect(await screen.findByRole('heading', { name: 'Edit Job' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Senior React Developer')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Location/)).toHaveValue('Cebu City');
    expect(screen.getByLabelText(/^Job Type/)).toHaveValue('remote');
    expect(screen.getByLabelText(/^Min Salary/)).toHaveValue('50000');
    expect(screen.getByLabelText(/^Max Salary/)).toHaveValue('80000');
    expect(screen.getByLabelText(/^Application Email/)).toHaveValue('jobs@acme.test');
  });

  it('saves with updateJob and returns to the dashboard', async () => {
    const user = userEvent.setup();
    mocks.updateJob.mockResolvedValue(job);
    renderPage('/jobs/12/edit');
    const title = await screen.findByDisplayValue('Senior React Developer');
    await user.clear(title);
    await user.type(title, 'Staff React Developer');
    await user.click(screen.getByRole('button', { name: /Save Changes/ }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(mocks.updateJob).toHaveBeenCalledWith(12, expect.objectContaining({ title: 'Staff React Developer' }));
    expect(mocks.createJob).not.toHaveBeenCalled();
  });

  it('offers a Cancel link back to the dashboard', async () => {
    renderPage('/jobs/12/edit');
    expect(await screen.findByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/employers/dashboard');
  });

  it('keeps a category that is not in the standard list', async () => {
    mocks.getJob.mockResolvedValue({ ...job, category: 'Legal' });
    renderPage('/jobs/12/edit');
    await screen.findByDisplayValue('Senior React Developer');
    expect(screen.getByRole('option', { name: 'Legal' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Category/)).toHaveValue('Legal');
  });

  it('refuses to edit someone else’s job, with an announced message', async () => {
    mocks.getJob.mockResolvedValue({ ...job, employer_id: 99 });
    renderPage('/jobs/12/edit');
    expect(await screen.findByRole('alert')).toHaveTextContent('You can only edit jobs that you posted.');
    expect(screen.queryByLabelText(/^Job Title/)).not.toBeInTheDocument();
  });

  it('says so when the job does not exist', async () => {
    mocks.getJob.mockRejectedValue(new Error('404'));
    renderPage('/jobs/12/edit');
    expect(await screen.findByRole('alert')).toHaveTextContent('Job not found.');
  });
});
