import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmployerLogin from './EmployerLogin';

const mocks = vi.hoisted(() => ({ login: vi.fn(), getPostLoginTarget: vi.fn() }));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select({ login: mocks.login }),
}));
vi.mock('../../utils/authRedirect', () => ({ getPostLoginTarget: mocks.getPostLoginTarget }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/employers']}>
      <Routes>
        <Route path="/employers" element={<EmployerLogin />} />
        <Route path="/after-login" element={<p>Landed</p>} />
      </Routes>
    </MemoryRouter>,
  );

const fillAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Email'), 'alex@example.test');
  await user.type(screen.getByLabelText('Password'), 'secret-pass');
  await user.click(screen.getByRole('button', { name: /Log In/ }));
};

describe('EmployerLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPostLoginTarget.mockReturnValue('/after-login');
  });

  it('has a heading, labelled fields, and links to signup and password reset', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Employers Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/employers/signup');
    expect(screen.getByRole('link', { name: 'Forgot Password' })).toHaveAttribute('href', '/employers/forgot-password');
    expect(screen.getByRole('link', { name: 'Post a Job Instead' })).toHaveAttribute('href', '/post');
  });

  it('ties the required-field errors to their inputs when submitted empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Log In/ }));

    const email = screen.getByLabelText('Email');
    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription('The Email field is required');

    const password = screen.getByLabelText('Password');
    expect(password).toBeInvalid();
    expect(password).toHaveAccessibleDescription('The Password field is required');

    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('logs in and follows the post-login target', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ id: 1, role: 'employer' });
    renderPage();
    await fillAndSubmit(user);

    expect(await screen.findByText('Landed')).toBeInTheDocument();
    expect(mocks.login).toHaveBeenCalledWith({
      email: 'alex@example.test',
      password: 'secret-pass',
      remember: false,
    });
    expect(mocks.getPostLoginTarget).toHaveBeenCalledWith({ id: 1, role: 'employer' }, undefined);
  });

  it('sends remember: true when "Keep Me Logged In" is ticked', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ id: 1, role: 'employer' });
    renderPage();
    await user.click(screen.getByLabelText('Keep Me Logged In'));
    await fillAndSubmit(user);

    await screen.findByText('Landed');
    expect(mocks.login).toHaveBeenCalledWith(expect.objectContaining({ remember: true }));
  });

  it('shows the server’s message and stays on the page when login fails', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue({ response: { data: { message: 'These credentials do not match.' } } });
    renderPage();
    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('These credentials do not match.');
    expect(screen.queryByText('Landed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/ })).toBeEnabled();
  });

  it('tells the user to wait when the server rate-limits the login (429)', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue({ response: { status: 429, data: { message: 'Too Many Attempts.' } } });
    renderPage();
    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Please wait a minute and try again.',
    );
  });

  it('falls back to a generic message when the error has none', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue(new Error('network down'));
    renderPage();
    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('disables the button while the request is in flight', async () => {
    const user = userEvent.setup();
    let finish!: (value: unknown) => void;
    mocks.login.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderPage();
    await fillAndSubmit(user);

    expect(await screen.findByRole('button', { name: /Logging in/ })).toBeDisabled();

    finish({ id: 1, role: 'employer' });
    expect(await screen.findByText('Landed')).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderPage();
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
