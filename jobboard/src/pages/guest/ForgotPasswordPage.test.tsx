import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';

const mocks = vi.hoisted(() => ({ forgotPassword: vi.fn() }));
vi.mock('../../api/client', () => ({ forgotPassword: mocks.forgotPassword }));

const renderPage = (path = '/applicants/forgot-password') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/applicants/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/employers/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const submit = async (user: ReturnType<typeof userEvent.setup>, email = 'alex@example.test') => {
  if (email) await user.type(screen.getByLabelText('Email'), email);
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has a heading, a labelled email field and a way back to login', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Forgot your password?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', '/applicants');
  });

  it('sends employers back to the employer login', () => {
    renderPage('/employers/forgot-password');
    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', '/employers');
  });

  it('asks for an email, with the message tied to the field', async () => {
    const user = userEvent.setup();
    renderPage();
    await submit(user, '');
    expect(screen.getByLabelText('Email')).toBeInvalid();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('The Email field is required');
    expect(mocks.forgotPassword).not.toHaveBeenCalled();
  });

  it('shows the message for a malformed email instead of the browser tooltip', async () => {
    const user = userEvent.setup();
    renderPage();
    await submit(user, 'not-an-email');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email');
    expect(mocks.forgotPassword).not.toHaveBeenCalled();
  });

  it('sends the email and then says a link was sent, without confirming the account exists', async () => {
    const user = userEvent.setup();
    mocks.forgotPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await submit(user);

    // React Query passes extra context after the variables, so check the first argument
    expect(mocks.forgotPassword.mock.calls[0][0]).toBe('alex@example.test');
    const note = await screen.findByRole('status');
    expect(note).toHaveTextContent("If that email has an account, we've sent a link");
    expect(note).toHaveTextContent('expires in 60 minutes');
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to login/ })).toHaveAttribute('href', '/applicants');
  });

  it('shows the too-many-attempts message and keeps the form', async () => {
    const user = userEvent.setup();
    mocks.forgotPassword.mockRejectedValue({ response: { status: 429 } });
    renderPage();
    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('falls back to a generic message for other failures', async () => {
    const user = userEvent.setup();
    mocks.forgotPassword.mockRejectedValue(new Error('network'));
    renderPage();
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
  });

  it('disables the button while sending', async () => {
    const user = userEvent.setup();
    mocks.forgotPassword.mockReturnValue(new Promise(() => {}));
    renderPage();
    await submit(user);
    expect(await screen.findByRole('button', { name: 'Sending...' })).toBeDisabled();
  });
});
