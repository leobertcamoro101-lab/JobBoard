import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ApplicantSignup from './ApplicantSignup';

const mocks = vi.hoisted(() => ({
  registerApplicant: vi.fn(),
  confirmApplicantSignup: vi.fn(),
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
    <MemoryRouter initialEntries={['/applicants/signup']}>
      <Routes>
        <Route path="/applicants/signup" element={<ApplicantSignup />} />
        <Route path="/" element={<p>Landed</p>} />
      </Routes>
    </MemoryRouter>,
  );

const PASSWORD = 'Str0ng!Passw0rd';

async function fillStep1(overrides: Partial<Record<'password' | 'confirm', string>> = {}) {
  await user.type(screen.getByLabelText(/^Email Address/), 'alex@example.test');
  await user.type(screen.getByLabelText(/^Password\b/), overrides.password ?? PASSWORD);
  await user.type(screen.getByLabelText(/^Confirm Password/), overrides.confirm ?? PASSWORD);
  await user.type(screen.getByLabelText(/^First Name/), 'Alex');
  await user.type(screen.getByLabelText(/^Last Name/), 'Applicant');
  await user.type(screen.getByLabelText(/^Mobile Number/), '09170000000');
}

async function goToStep2(requiresCode = true) {
  mocks.registerApplicant.mockResolvedValue({ email: 'alex@example.test', requiresCode });
  renderPage();
  await fillStep1();
  await user.click(screen.getByRole('button', { name: /Next/ }));
  await screen.findByText('2 of 2');
}

const pickFile = async (file: File) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, file);
};
const pdf = () => new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });

describe('ApplicantSignup, step 1', () => {
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
    ];
    for (const [label, message] of expected) {
      const field = screen.getByLabelText(label);
      expect(field).toBeInvalid();
      expect(field).toHaveAccessibleDescription(expect.stringContaining(message));
    }
    expect(mocks.registerApplicant).not.toHaveBeenCalled();
  });

  it('explains which password rule is missing', async () => {
    renderPage();
    await user.type(screen.getByLabelText(/^Password\b/), 'alllowercase1!');
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(screen.getByLabelText(/^Password\b/)).toHaveAccessibleDescription(
      expect.stringContaining('Password must include an uppercase letter'),
    );
  });

  it('rejects mismatched passwords on the confirm field', async () => {
    renderPage();
    await fillStep1({ confirm: 'Different!Passw0rd' });
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(screen.getByLabelText(/^Confirm Password/)).toHaveAccessibleDescription(
      expect.stringContaining('Passwords do not match'),
    );
    expect(mocks.registerApplicant).not.toHaveBeenCalled();
  });

  it('registers and moves to step 2', async () => {
    await goToStep2();

    expect(mocks.registerApplicant).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alex@example.test',
        firstName: 'Alex',
        lastName: 'Applicant',
        mobileNumber: '09170000000',
      }),
    );
    expect(screen.getByText('alex@example.test')).toBeInTheDocument();
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
    expect(mocks.registerApplicant).not.toHaveBeenCalled();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('tells the user to wait when registration is rate-limited (429)', async () => {
    mocks.registerApplicant.mockRejectedValue({ response: { status: 429, data: { message: 'Too Many Attempts.' } } });
    renderPage();
    await fillStep1();
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Please wait a minute and try again.',
    );
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('shows the server’s message when registration fails', async () => {
    mocks.registerApplicant.mockRejectedValue({ response: { data: { message: 'The email has already been taken.' } } });
    renderPage();
    await fillStep1();
    await user.click(screen.getByRole('button', { name: /Next/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The email has already been taken.');
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });
});

describe('ApplicantSignup, step 2', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for a resume before anything else', async () => {
    await goToStep2();
    await user.click(screen.getByRole('button', { name: /Upload Resume/ }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please select a resume file');
    expect(mocks.confirmApplicantSignup).not.toHaveBeenCalled();
  });

  it('rejects the wrong file type and keeps showing "No Resume Selected"', async () => {
    await goToStep2();
    await pickFile(new File(['x'], 'resume.exe'));

    expect(screen.getByRole('alert')).toHaveTextContent('Only files with .doc, .docx, .odt, .pdf, .rtf');
    expect(screen.getByText('No Resume Selected...')).toBeInTheDocument();
  });

  it('rejects a file over 900kb', async () => {
    await goToStep2();
    await pickFile(new File([new Uint8Array(900 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' }));

    expect(screen.getByRole('alert')).toHaveTextContent('File must be less than 900kb');
  });

  it('shows the chosen file’s name', async () => {
    await goToStep2();
    await pickFile(pdf());

    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('ties a missing confirmation code to its input', async () => {
    await goToStep2();
    await pickFile(pdf());
    await user.click(screen.getByRole('button', { name: /Upload Resume/ }));

    const code = screen.getByLabelText(/^Confirmation Code/);
    expect(code).toBeInvalid();
    expect(code).toHaveAccessibleDescription('Confirmation Code is required');
    expect(mocks.confirmApplicantSignup).not.toHaveBeenCalled();
  });

  it('confirms with the code and resume, then lands on the home page', async () => {
    mocks.confirmApplicantSignup.mockResolvedValue({ id: 1 });
    await goToStep2();
    await pickFile(pdf());
    await user.type(screen.getByLabelText(/^Confirmation Code/), '123456');
    await user.click(screen.getByRole('button', { name: /Upload Resume/ }));

    expect(await screen.findByText('Landed')).toBeInTheDocument();
    expect(mocks.confirmApplicantSignup).toHaveBeenCalledWith({
      email: 'alex@example.test',
      code: '123456',
      file: expect.any(File),
      allowView: true,
    });
  });

  it('sends allowView: false when the box is unticked', async () => {
    mocks.confirmApplicantSignup.mockResolvedValue({ id: 1 });
    await goToStep2();
    await pickFile(pdf());
    await user.click(screen.getByLabelText(/Allow companies to view my resume/));
    await user.type(screen.getByLabelText(/^Confirmation Code/), '123456');
    await user.click(screen.getByRole('button', { name: /Upload Resume/ }));

    await screen.findByText('Landed');
    expect(mocks.confirmApplicantSignup).toHaveBeenCalledWith(expect.objectContaining({ allowView: false }));
  });

  it('skips the code field and the resend button when the server sent no code', async () => {
    mocks.confirmApplicantSignup.mockResolvedValue({ id: 1 });
    await goToStep2(false);

    expect(screen.queryByLabelText(/^Confirmation Code/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend Confirmation Code' })).not.toBeInTheDocument();

    await pickFile(pdf());
    await user.click(screen.getByRole('button', { name: /Upload Resume/ }));
    expect(await screen.findByText('Landed')).toBeInTheDocument();
  });

  it('resends the code to the registered email', async () => {
    mocks.resendCode.mockResolvedValue(undefined);
    await goToStep2();
    await user.click(screen.getByRole('button', { name: 'Resend Confirmation Code' }));

    expect(mocks.resendCode).toHaveBeenCalledWith({ email: 'alex@example.test' });
    expect(await screen.findByRole('button', { name: 'Resend Confirmation Code' })).toBeEnabled();
  });

  it('shows the server’s message when the code is wrong, and stays on step 2', async () => {
    mocks.confirmApplicantSignup.mockRejectedValue({ response: { data: { message: 'The code is invalid or has expired.' } } });
    await goToStep2();
    await pickFile(pdf());
    await user.type(screen.getByLabelText(/^Confirmation Code/), '000000');
    await user.click(screen.getByRole('button', { name: /Upload Resume/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The code is invalid or has expired.');
    expect(screen.queryByText('Landed')).not.toBeInTheDocument();
  });
});
