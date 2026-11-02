import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmployerSignup from './EmployerSignup';

const mocks = vi.hoisted(() => ({
  registerEmployer: vi.fn(),
  confirmEmployerSignup: vi.fn(),
  resendCode: vi.fn(),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (select: (s: unknown) => unknown) => select(mocks),
}));

// applyAccept: false lets the tests pick files the input's `accept` list would filter out,
// so the component's own extension check is what gets exercised.
const user = userEvent.setup({ applyAccept: false });

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/employers/signup']}>
      <Routes>
        <Route path="/employers/signup" element={<EmployerSignup />} />
        <Route path="/employers/dashboard" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );

const PASSWORD = 'Str0ng!Passw0rd';

async function fillStep1(website = '') {
  await user.type(screen.getByLabelText(/^Email Address/), 'emma@example.test');
  await user.type(screen.getByLabelText(/^Password\b/), PASSWORD);
  await user.type(screen.getByLabelText(/^Confirm Password/), PASSWORD);
  await user.type(screen.getByLabelText(/^First Name/), 'Emma');
  await user.type(screen.getByLabelText(/^Last Name/), 'Employer');
  await user.type(screen.getByLabelText(/^Mobile Number/), '09170000000');
  await user.type(screen.getByLabelText(/^Company Name/), 'Acme Corp');
  if (website) await user.type(screen.getByLabelText(/^Company Website/), website);
}

async function goToStep2(requiresCode = true) {
  mocks.registerEmployer.mockResolvedValue({ email: 'emma@example.test', requiresCode });
  renderPage();
  await fillStep1();
  await user.click(screen.getByRole('button', { name: /Next/ }));
  await screen.findByText('2 of 2');
}

describe('EmployerSignup, step 1', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ties every required-field error to its input when submitted empty', async () => {
    renderPage();
    await user.click(screen.getByRole('button', { name: /Next/ }));

    const expected: [RegExp, string][] = [
      [/^Email Address/, 'Email Address is required'],
      [/^Password\b/, 'Password must be at least ten (10) characters'],
      [/^Confirm Password/, 'Please confirm your password'],
      [/^First Name/, 'First Name is required'],
      [/^Last Name/, 'Last Name is required'],
      [/^Mobile Number/, 'Mobile Number is required'],
      [/^Company Name/, 'Company Name is required'],
    ];
    for (const [label, message] of expected) {
      const field = screen.getByLabelText(label);
      expect(field).toBeInvalid();
      expect(field).toHaveAccessibleDescription(expect.stringContaining(message));
    }
    expect(mocks.registerEmployer).not.toHaveBeenCalled();
  });

  it('rejects a company website that is not a URL, but allows it to be empty', async () => {
    renderPage();
    await fillStep1('yourcompany.com');
    await user.click(screen.getByRole('button', { name: /Next/ }));

    const website = screen.getByLabelText(/^Company Website/);
    expect(website).toBeInvalid();
    expect(website).toHaveAccessibleDescription('Must be a valid URL');
    expect(mocks.registerEmployer).not.toHaveBeenCalled();
  });

  it('registers and moves to the logo step', async () => {
    await goToStep2();

    expect(mocks.registerEmployer).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'emma@example.test', companyName: 'Acme Corp', firstName: 'Emma' }),
    );
    expect(screen.getByRole('heading', { name: 'Company Logo' })).toBeInTheDocument();
    expect(screen.getByText('emma@example.test')).toBeInTheDocument();
  });

  it('shows "Enter a valid email" for a malformed address instead of the browser tooltip', async () => {
    renderPage();
    await fillStep1();
    const email = screen.getByLabelText(/^Email Address/);
    await user.clear(email);
    await user.type(email, 'not-an-email');
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(email).toBeInvalid();
    expect(email).toHaveAccessibleDescription('Enter a valid email');
    expect(mocks.registerEmployer).not.toHaveBeenCalled();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('tells the user to wait when registration is rate-limited (429)', async () => {
    mocks.registerEmployer.mockRejectedValue({ response: { status: 429, data: { message: 'Too Many Attempts.' } } });
    renderPage();
    await fillStep1();
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Please wait a minute and try again.',
    );
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('shows the server’s message when registration fails', async () => {
    mocks.registerEmployer.mockRejectedValue({ response: { data: { message: 'The email has already been taken.' } } });
    renderPage();
    await fillStep1();
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The email has already been taken.');
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });
});

describe('EmployerSignup, step 2', () => {
  beforeEach(() => vi.clearAllMocks());

  it('treats the logo as optional, but still needs the code', async () => {
    mocks.confirmEmployerSignup.mockResolvedValue({ id: 2 });
    await goToStep2();
    await user.click(screen.getByRole('button', { name: /Create Account/ }));

    const code = screen.getByLabelText(/^Confirmation Code/);
    expect(code).toBeInvalid();
    expect(code).toHaveAccessibleDescription('Confirmation Code is required');
    expect(mocks.confirmEmployerSignup).not.toHaveBeenCalled();

    await user.type(code, '123456');
    await user.click(screen.getByRole('button', { name: /Create Account/ }));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(mocks.confirmEmployerSignup).toHaveBeenCalledWith({ email: 'emma@example.test', code: '123456', file: null });
  });

  it('sends the chosen logo along with the code', async () => {
    mocks.confirmEmployerSignup.mockResolvedValue({ id: 2 });
    await goToStep2();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['x'], 'logo.png', { type: 'image/png' }));
    expect(screen.getByText('logo.png')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Confirmation Code/), '123456');
    await user.click(screen.getByRole('button', { name: /Create Account/ }));

    await screen.findByText('Dashboard');
    expect(mocks.confirmEmployerSignup).toHaveBeenCalledWith({
      email: 'emma@example.test',
      code: '123456',
      file: expect.any(File),
    });
  });

  it('rejects the wrong file type and an oversized logo', async () => {
    await goToStep2();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(['x'], 'logo.gif', { type: 'image/gif' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Only files with .jpg, .jpeg, .png, .webp');
    expect(screen.getByText('No Logo Selected...')).toBeInTheDocument();

    await user.upload(input, new File([new Uint8Array(900 * 1024 + 1)], 'huge.png', { type: 'image/png' }));
    expect(screen.getByRole('alert')).toHaveTextContent('File must be less than 900kb');
  });

  it('skips the code field and resend button when the server sent no code', async () => {
    mocks.confirmEmployerSignup.mockResolvedValue({ id: 2 });
    await goToStep2(false);

    expect(screen.queryByLabelText(/^Confirmation Code/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend Confirmation Code' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Create Account/ }));
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('resends the code to the registered email', async () => {
    mocks.resendCode.mockResolvedValue(undefined);
    await goToStep2();
    await user.click(screen.getByRole('button', { name: 'Resend Confirmation Code' }));

    expect(mocks.resendCode).toHaveBeenCalledWith({ email: 'emma@example.test' });
  });

  it('shows the server’s message when the code is wrong, and stays on step 2', async () => {
    mocks.confirmEmployerSignup.mockRejectedValue({ response: { data: { message: 'The code is invalid or has expired.' } } });
    await goToStep2();
    await user.type(screen.getByLabelText(/^Confirmation Code/), '000000');
    await user.click(screen.getByRole('button', { name: /Create Account/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The code is invalid or has expired.');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
