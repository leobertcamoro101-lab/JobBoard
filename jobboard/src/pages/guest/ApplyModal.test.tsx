import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from '../../types';
import ApplyModal from './ApplyModal';

const mocks = vi.hoisted(() => ({
  applyForJob: vi.fn(),
  state: { user: null as unknown },
}));

vi.mock('../../api/client', () => ({ applyForJob: mocks.applyForJob }));
vi.mock('../../stores/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select(mocks.state),
}));

const job = { id: 7, title: 'Senior React Developer', company: 'Acme Corp', apply_email: 'jobs@acme.test' } as unknown as Job;

const applicant = {
  id: 1,
  role: 'applicant',
  name: 'Alex Applicant',
  email: 'alex@example.test',
  mobile_number: '09170000000',
  applicant_profile: { resume_url: '/storage/resumes/a.pdf', allow_view: true },
};

const user = userEvent.setup();
const coverLetter = 'I would be a great fit for this role. '.repeat(4);

const renderModal = (onClose = vi.fn()) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ApplyModal job={job} onClose={onClose} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { onClose, dialog: screen.getByRole('dialog', { name: 'Apply for Senior React Developer' }) };
};

const typeInto = async (label: RegExp, text: string) => {
  await user.click(screen.getByLabelText(label));
  await user.paste(text);
};

const submit = () => user.click(screen.getByRole('button', { name: /Submit Application/ }));

describe('ApplyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state.user = null;
  });

  it('is a dialog named after the job, and shows the company', () => {
    const { dialog } = renderModal();
    expect(within(dialog).getByText('Acme Corp')).toBeInTheDocument();
    expect(dialog).toHaveFocus();
  });

  it('closes with Escape and with the × button', async () => {
    const { onClose } = renderModal();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  describe('as a guest', () => {
    it('asks for name, email and a cover letter, and ties each error to its field', async () => {
      renderModal();
      await submit();

      const expected: [RegExp, string][] = [
        [/^Full Name/, 'Name is required'],
        [/^Email/, 'Valid email required'],
        [/^Cover Letter/, 'Cover letter must be at least 100 characters'],
      ];
      for (const [label, message] of expected) {
        const field = screen.getByLabelText(label);
        expect(field).toBeInvalid();
        expect(field).toHaveAccessibleDescription(message);
      }
      expect(mocks.applyForJob).not.toHaveBeenCalled();
    });

    it('rejects a cover letter that is one character short', async () => {
      renderModal();
      await typeInto(/^Full Name/, 'Gina Guest');
      await typeInto(/^Email/, 'gina@example.test');
      await typeInto(/^Cover Letter/, 'x'.repeat(99));
      await submit();

      expect(screen.getByLabelText(/^Cover Letter/)).toHaveAccessibleDescription(
        'Cover letter must be at least 100 characters',
      );
    });

    it('ties bad LinkedIn and portfolio URLs to their fields', async () => {
      renderModal();
      await typeInto(/^LinkedIn URL/, 'linkedin.com/in/gina');
      await typeInto(/^Portfolio URL/, 'my site');
      await submit();

      expect(screen.getByLabelText(/^LinkedIn URL/)).toHaveAccessibleDescription('Must be a valid URL');
      expect(screen.getByLabelText(/^Portfolio URL/)).toHaveAccessibleDescription('Must be a valid URL');
      expect(mocks.applyForJob).not.toHaveBeenCalled();
    });

    it('submits, then confirms and tells them where the reply will go', async () => {
      mocks.applyForJob.mockResolvedValue({});
      renderModal();
      await typeInto(/^Full Name/, 'Gina Guest');
      await typeInto(/^Email/, 'gina@example.test');
      await typeInto(/^Cover Letter/, coverLetter);
      await submit();

      expect(await screen.findByText('Application Submitted!')).toBeInTheDocument();
      expect(mocks.applyForJob).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ name: 'Gina Guest', email: 'gina@example.test', cover_letter: coverLetter }),
      );
      expect(screen.getByText(/jobs@acme\.test/)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'View my applications' })).not.toBeInTheDocument();
    });
  });

  describe('as a signed-in applicant', () => {
    beforeEach(() => {
      mocks.state.user = applicant;
    });

    it('shows who they are applying as instead of name and email inputs', () => {
      renderModal();
      expect(screen.getByText('Applying as')).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Full Name/)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^Phone/)).toHaveValue('09170000000');
    });

    it('only needs a cover letter, and still ties its error to the field', async () => {
      renderModal();
      await submit();

      expect(screen.getByLabelText(/^Cover Letter/)).toHaveAccessibleDescription(
        'Cover letter must be at least 100 characters',
      );
      expect(mocks.applyForJob).not.toHaveBeenCalled();
    });

    it('sends the account’s name and email with the application', async () => {
      mocks.applyForJob.mockResolvedValue({});
      renderModal();
      await typeInto(/^Cover Letter/, coverLetter);
      await submit();

      await screen.findByText('Application Submitted!');
      expect(mocks.applyForJob).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ name: 'Alex Applicant', email: 'alex@example.test', cover_letter: coverLetter }),
      );
    });

    it('confirms to their own email, offers their applications, and puts focus on Close', async () => {
      mocks.applyForJob.mockResolvedValue({});
      const { onClose } = renderModal();
      await typeInto(/^Cover Letter/, coverLetter);
      await submit();

      await screen.findByText('Application Submitted!');
      expect(screen.getByText(/alex@example\.test/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'View my applications' })).toHaveAttribute('href', '/applicants/dashboard');

      const close = screen.getByText('Close', { selector: 'button' });
      expect(close).toHaveFocus();
      await user.click(close);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the server’s message when submitting fails, and keeps the form', async () => {
    mocks.state.user = applicant;
    mocks.applyForJob.mockRejectedValue({ response: { data: { message: 'You have already applied to this job.' } } });
    renderModal();
    await typeInto(/^Cover Letter/, coverLetter);
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('You have already applied to this job.');
    expect(screen.getByLabelText(/^Cover Letter/)).toHaveValue(coverLetter);
    expect(screen.getByRole('button', { name: /Submit Application/ })).toBeEnabled();
  });

  it('falls back to a generic message', async () => {
    mocks.state.user = applicant;
    mocks.applyForJob.mockRejectedValue(new Error('offline'));
    renderModal();
    await typeInto(/^Cover Letter/, coverLetter);
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to submit');
  });

  it('disables the submit button while the request is in flight', async () => {
    mocks.state.user = applicant;
    let finish!: (value: unknown) => void;
    mocks.applyForJob.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderModal();
    await typeInto(/^Cover Letter/, coverLetter);
    await submit();

    expect(await screen.findByRole('button', { name: /Submitting/ })).toBeDisabled();

    finish({});
    expect(await screen.findByText('Application Submitted!')).toBeInTheDocument();
  });
});
