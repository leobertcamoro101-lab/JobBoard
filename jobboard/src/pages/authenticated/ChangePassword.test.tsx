import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePasswordPage from './ChangePassword';

const mocks = vi.hoisted(() => ({ changePassword: vi.fn() }));
vi.mock('../../api/client', () => ({ changePassword: mocks.changePassword }));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <ChangePasswordPage />
    </QueryClientProvider>,
  );

const GOOD = 'New-Passw0rd!';

const fill = async (user: ReturnType<typeof userEvent.setup>, current: string, next: string, confirm: string) => {
  if (current) await user.type(screen.getByLabelText('Current password'), current);
  if (next) await user.type(screen.getByLabelText('New password'), next);
  if (confirm) await user.type(screen.getByLabelText('Confirm new password'), confirm);
  await user.click(screen.getByRole('button', { name: 'Update password' }));
};

describe('ChangePasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('has a heading and three labelled password fields', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
    for (const name of ['Current password', 'New password', 'Confirm new password']) {
      expect(screen.getByLabelText(name)).toHaveAttribute('type', 'password');
    }
  });

  it('reads the password rule with the new-password field', () => {
    renderPage();
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(/At least ten \(10\) characters/);
  });

  it('ties each message to its field when submitted empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByLabelText('Current password')).toBeInvalid();
    expect(screen.getByLabelText('Current password')).toHaveAccessibleDescription('Enter your current password');
    expect(screen.getByLabelText('New password')).toBeInvalid();
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(/ten \(10\) characters/);
    expect(screen.getByLabelText('Confirm new password')).toHaveAccessibleDescription('Please confirm your new password');
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('says which rule a weak password misses, and keeps the rule text readable', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, 'old-pass', 'alllowercase1!', 'alllowercase1!');

    const field = screen.getByLabelText('New password');
    expect(field).toHaveAccessibleDescription(/At least ten.*Password must include an uppercase letter/);
  });

  it('rejects a confirmation that does not match', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, 'old-pass', GOOD, 'Different-Passw0rd!');
    expect(screen.getByLabelText('Confirm new password')).toHaveAccessibleDescription('Passwords do not match');
  });

  it('rejects reusing the current password', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, GOOD, GOOD, GOOD);
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(
      /New password must be different from the current one/,
    );
  });

  it('shows and hides all three passwords with one toggle', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Show passwords' }));
    for (const name of ['Current password', 'New password', 'Confirm new password']) {
      expect(screen.getByLabelText(name)).toHaveAttribute('type', 'text');
    }
    await user.click(screen.getByRole('button', { name: 'Hide passwords' }));
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password');
  });

  it('sends the three fields, confirms, and clears the form', async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockResolvedValue({ message: 'ok' });
    renderPage();
    await fill(user, 'old-pass', GOOD, GOOD);

    expect(mocks.changePassword).toHaveBeenCalledWith(
      { current_password: 'old-pass', password: GOOD, password_confirmation: GOOD },
      expect.anything(),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Password updated.');
    expect(screen.getByLabelText('Current password')).toHaveValue('');
    expect(screen.getByLabelText('New password')).toHaveValue('');
  });

  it('puts a server 422 on the wrong current password next to that field, not in a banner', async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockRejectedValue({
      response: { status: 422, data: { errors: { current_password: ['The current password is incorrect.'] } } },
    });
    renderPage();
    await fill(user, 'wrong-pass', GOOD, GOOD);

    const field = screen.getByLabelText('Current password');
    expect(await screen.findByText('The current password is incorrect.')).toBeInTheDocument();
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('The current password is incorrect.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a banner for other failures', async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockRejectedValue({ response: { status: 500, data: { message: 'Server exploded' } } });
    renderPage();
    await fill(user, 'old-pass', GOOD, GOOD);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
  });

  it('disables the button while the request is in flight', async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockReturnValue(new Promise(() => {}));
    renderPage();
    await fill(user, 'old-pass', GOOD, GOOD);
    expect(await screen.findByRole('button', { name: 'Updating...' })).toBeDisabled();
  });
});
