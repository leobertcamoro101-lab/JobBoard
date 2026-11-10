import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from './ResetPasswordPage';

const mocks = vi.hoisted(() => ({ resetPassword: vi.fn() }));
vi.mock('../../api/client', () => ({ resetPassword: mocks.resetPassword }));

const GOOD = 'New-Passw0rd!x';

const renderPage = (search = '?token=tok123&email=alex%40example.test') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <MemoryRouter initialEntries={[`/reset-password${search}`]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const fill = async (user: ReturnType<typeof userEvent.setup>, next: string, confirm: string) => {
  if (next) await user.type(screen.getByLabelText('New password'), next);
  if (confirm) await user.type(screen.getByLabelText('Confirm new password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Reset password' }));
};

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('says which account it is for and has two labelled password fields', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
    expect(screen.getByText('alex@example.test')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirm new password')).toHaveAttribute('type', 'password');
  });

  it('reads the password rule with the new-password field', () => {
    renderPage();
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(/At least ten \(10\) characters/);
  });

  it.each([
    ['no token', '?email=alex%40example.test'],
    ['no email', '?token=tok123'],
    ['nothing', ''],
  ])('explains an incomplete link (%s) and offers a new one instead of a form', (_name, search) => {
    renderPage(search);
    expect(screen.getByRole('alert')).toHaveTextContent('This reset link is incomplete');
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/applicants/forgot-password');
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('ties each message to its field when submitted empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, '', '');
    expect(screen.getByLabelText('New password')).toBeInvalid();
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(/ten \(10\) characters/);
    expect(screen.getByLabelText('Confirm new password')).toHaveAccessibleDescription('Please confirm your new password');
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('says which rule a weak password misses', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, 'alllowercase1!', 'alllowercase1!');
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(
      /Password must include an uppercase letter/,
    );
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('rejects a password that is too short, with the error (not just the hint) on the field', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, 'Aa1!aaaa', 'Aa1!aaaa');
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(
      /Password must be at least ten \(10\) characters/,
    );
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, GOOD, 'Different-Passw0rd!');
    expect(screen.getByLabelText('Confirm new password')).toHaveAccessibleDescription('Passwords do not match');
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it('shows and hides both passwords with one toggle', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Show passwords' }));
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Confirm new password')).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide passwords' }));
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password');
  });

  it('sends the token and email from the link with the new password', async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await fill(user, GOOD, GOOD);

    // React Query passes extra context after the variables, so check the first argument
    expect(mocks.resetPassword.mock.calls[0][0]).toEqual({
      token: 'tok123',
      email: 'alex@example.test',
      password: GOOD,
      password_confirmation: GOOD,
    });
  });

  it('confirms the reset and links to both logins', async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await fill(user, GOOD, GOOD);

    expect(await screen.findByRole('status')).toHaveTextContent('Your password has been reset');
    expect(screen.getByRole('heading', { name: 'Password reset' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'applicant' })).toHaveAttribute('href', '/applicants');
    expect(screen.getByRole('link', { name: 'employer' })).toHaveAttribute('href', '/employers');
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('shows an invalid or expired link as an alert with a way to ask again', async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockRejectedValue({
      response: { status: 422, data: { errors: { email: ['This reset link is invalid or has expired. Please request a new one.'] } } },
    });
    renderPage();
    await fill(user, GOOD, GOOD);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This reset link is invalid or has expired.');
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/applicants/forgot-password');
  });

  it('puts a server-side password complaint on the password field, not in a banner', async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockRejectedValue({
      response: { status: 422, data: { errors: { password: ['The password is too common.'] } } },
    });
    renderPage();
    await fill(user, GOOD, GOOD);

    expect(await screen.findByText('The password is too common.')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(/The password is too common\./);
    expect(screen.queryByRole('link', { name: 'Request a new link' })).not.toBeInTheDocument();
  });

  it('shows the too-many-attempts message', async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockRejectedValue({ response: { status: 429 } });
    renderPage();
    await fill(user, GOOD, GOOD);
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });

  it('disables the button while resetting', async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockReturnValue(new Promise(() => {}));
    renderPage();
    await fill(user, GOOD, GOOD);
    expect(await screen.findByRole('button', { name: 'Resetting...' })).toBeDisabled();
  });
});
