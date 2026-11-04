import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../types';
import ProfilePage from './ProfilePage';

const mocks = vi.hoisted(() => ({ updateProfile: vi.fn(), setState: vi.fn(), user: null as unknown }));

vi.mock('../../api/client', () => ({ updateProfile: mocks.updateProfile }));
vi.mock('../../stores/authStore', () => ({
  useAuthStore: Object.assign((select: (s: unknown) => unknown) => select({ user: mocks.user }), {
    setState: mocks.setState,
  }),
}));

const applicant = {
  id: 1,
  role: 'applicant',
  first_name: 'Alex',
  last_name: 'Tan',
  email: 'alex@example.test',
  mobile_number: '09171234567',
  applicant_profile: { resume_url: null, allow_view: true },
} as unknown as User;

const employer = {
  id: 2,
  role: 'employer',
  first_name: 'Hana',
  last_name: 'Cruz',
  email: 'hr@acme.test',
  mobile_number: '09179999999',
  employer_profile: { company_name: 'Acme Corp', company_website: 'https://acme.test', company_logo_url: null },
} as unknown as User;

// applyAccept: false lets tests pick files the input's `accept` list would filter out,
// so the component's own extension check is what gets exercised.
const user = userEvent.setup({ applyAccept: false });

const renderPage = (u: User) => {
  mocks.user = u;
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <ProfilePage />
    </QueryClientProvider>,
  );
};

const sentForm = () => mocks.updateProfile.mock.calls[0][0] as FormData;
const save = () => user.click(screen.getByRole('button', { name: 'Save changes' }));
const pdf = (name = 'cv.pdf', size = 10) => new File([new Uint8Array(size)], name, { type: 'application/pdf' });

describe('ProfilePage, applicant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateProfile.mockResolvedValue({ ...applicant, first_name: 'Alexander' });
  });

  it('shows labelled, prefilled details and a locked email with its explanation', () => {
    renderPage(applicant);
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toHaveValue('Alex');
    expect(screen.getByLabelText('Last Name')).toHaveValue('Tan');
    expect(screen.getByLabelText('Mobile Number')).toHaveValue('09171234567');
    const email = screen.getByLabelText('Email');
    expect(email).toBeDisabled();
    expect(email).toHaveValue('alex@example.test');
    expect(email).toHaveAccessibleDescription(/can't be changed here/);
  });

  it('has no company fields', () => {
    renderPage(applicant);
    expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();
  });

  it('never reuses an id', () => {
    const { container } = renderPage(applicant);
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ties each required-field error to its input when they are cleared', async () => {
    renderPage(applicant);
    for (const name of ['First Name', 'Last Name', 'Mobile Number']) await user.clear(screen.getByLabelText(name));
    await save();

    for (const [name, message] of [
      ['First Name', 'First Name is required'],
      ['Last Name', 'Last Name is required'],
      ['Mobile Number', 'Mobile Number is required'],
    ]) {
      expect(screen.getByLabelText(name)).toBeInvalid();
      expect(screen.getByLabelText(name)).toHaveAccessibleDescription(message);
    }
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it('sends the details and allow_view, then confirms', async () => {
    renderPage(applicant);
    const first = screen.getByLabelText('First Name');
    await user.clear(first);
    await user.type(first, 'Alexander');
    await save();

    expect(await screen.findByRole('status')).toHaveTextContent('Profile updated.');
    const fd = sentForm();
    expect(fd.get('first_name')).toBe('Alexander');
    expect(fd.get('last_name')).toBe('Tan');
    expect(fd.get('mobile_number')).toBe('09171234567');
    expect(fd.get('allow_view')).toBe('1');
    expect(fd.has('resume')).toBe(false);
    expect(mocks.setState).toHaveBeenCalledWith({ user: expect.objectContaining({ first_name: 'Alexander' }) });
  });

  it('sends allow_view 0 when the box is unticked', async () => {
    renderPage(applicant);
    await user.click(screen.getByRole('checkbox', { name: /Allow companies to view my resume/ }));
    await save();
    await screen.findByRole('status');
    expect(sentForm().get('allow_view')).toBe('0');
  });

  it('offers a link to the current resume when there is one', () => {
    renderPage({ ...applicant, applicant_profile: { resume_url: 'https://files.test/cv.pdf', allow_view: true } } as User);
    expect(screen.getByRole('link', { name: 'View current resume' })).toHaveAttribute('href', 'https://files.test/cv.pdf');
    expect(screen.getByLabelText('Replace resume')).toBeInTheDocument();
  });

  it('attaches a chosen resume and shows its name', async () => {
    renderPage(applicant);
    await user.upload(screen.getByLabelText('Select resume'), pdf('my-cv.pdf'));
    expect(screen.getByText('my-cv.pdf')).toBeInTheDocument();
    await save();
    await screen.findByRole('status');
    expect((sentForm().get('resume') as File).name).toBe('my-cv.pdf');
  });

  it('announces a wrong file type and does not attach it', async () => {
    renderPage(applicant);
    await user.upload(screen.getByLabelText('Select resume'), new File(['x'], 'photo.png', { type: 'image/png' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Only .doc, .docx, .odt, .pdf, .rtf files are allowed');
    expect(screen.getByText('No resume uploaded')).toBeInTheDocument();
  });

  it('announces a file over 900kb', async () => {
    renderPage(applicant);
    await user.upload(screen.getByLabelText('Select resume'), pdf('big.pdf', 900 * 1024 + 1));
    expect(await screen.findByRole('alert')).toHaveTextContent('File must be less than 900kb');
  });

  it('puts a server 422 next to its field, not in a banner', async () => {
    mocks.updateProfile.mockRejectedValue({
      response: { status: 422, data: { errors: { mobile_number: ['The mobile number is invalid.'] } } },
    });
    renderPage(applicant);
    await save();

    const field = screen.getByLabelText('Mobile Number');
    expect(await screen.findByText('The mobile number is invalid.')).toBeInTheDocument();
    expect(field).toHaveAccessibleDescription('The mobile number is invalid.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('puts a server file error under the picker, announced', async () => {
    mocks.updateProfile.mockRejectedValue({
      response: { status: 422, data: { errors: { resume: ['The resume must be a PDF.'] } } },
    });
    renderPage(applicant);
    await save();
    expect(await screen.findByRole('alert')).toHaveTextContent('The resume must be a PDF.');
  });

  it('shows a banner for other failures', async () => {
    mocks.updateProfile.mockRejectedValue({ response: { status: 500, data: { message: 'Server exploded' } } });
    renderPage(applicant);
    await save();
    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
  });

  it('disables the button while saving', async () => {
    mocks.updateProfile.mockReturnValue(new Promise(() => {}));
    renderPage(applicant);
    await save();
    expect(await screen.findByRole('button', { name: 'Saving...' })).toBeDisabled();
  });
});

describe('ProfilePage, employer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateProfile.mockResolvedValue(employer);
  });

  it('shows the company fields, prefilled, and no resume section', () => {
    renderPage(employer);
    expect(screen.getByLabelText('Company Name')).toHaveValue('Acme Corp');
    expect(screen.getByLabelText(/^Company Website/)).toHaveValue('https://acme.test');
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Select logo')).toBeInTheDocument();
  });

  it('requires a company name and ties the message to the field', async () => {
    renderPage(employer);
    await user.clear(screen.getByLabelText('Company Name'));
    await save();

    const field = screen.getByLabelText('Company Name');
    expect(field).toBeInvalid();
    expect(field).toHaveAccessibleDescription('Company Name is required');
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it('rejects a website that is not a URL, but allows it to be empty', async () => {
    renderPage(employer);
    const site = screen.getByLabelText(/^Company Website/);
    await user.clear(site);
    await user.type(site, 'not a url');
    await save();
    expect(site).toHaveAccessibleDescription('Must be a valid URL');

    await user.clear(site);
    await save();
    await screen.findByRole('status');
    expect(sentForm().get('company_website')).toBe('');
  });

  it('sends the company details and a chosen logo', async () => {
    renderPage(employer);
    await user.upload(screen.getByLabelText('Select logo'), new File(['x'], 'logo.png', { type: 'image/png' }));
    await save();
    await screen.findByRole('status');
    const fd = sentForm();
    expect(fd.get('company_name')).toBe('Acme Corp');
    expect(fd.get('company_website')).toBe('https://acme.test');
    expect((fd.get('logo') as File).name).toBe('logo.png');
    expect(fd.has('allow_view')).toBe(false);
  });

  it('rejects a resume-type file as a logo', async () => {
    renderPage(employer);
    await user.upload(screen.getByLabelText('Select logo'), pdf());
    expect(await screen.findByRole('alert')).toHaveTextContent('Only .jpg, .jpeg, .png, .webp files are allowed');
  });

  it('stops asking for the logo to be removed once a new file is chosen', async () => {
    renderPage({
      ...employer,
      employer_profile: { company_name: 'Acme Corp', company_website: null, company_logo_url: 'https://files.test/logo.png' },
    } as User);
    await user.click(screen.getByRole('checkbox', { name: 'Remove my logo' }));
    expect(screen.getByText('Logo will be removed')).toBeInTheDocument();

    await user.upload(screen.getByLabelText('Replace logo'), new File(['x'], 'new.png', { type: 'image/png' }));
    expect(screen.getByText('new.png')).toBeInTheDocument();

    // Choosing something invalid afterwards clears the file; the old removal request must not come back
    await user.upload(screen.getByLabelText('Replace logo'), pdf());
    expect(await screen.findByText('Current logo')).toBeInTheDocument();
    expect(screen.queryByText('Logo will be removed')).not.toBeInTheDocument();
  });

  it('can ask for the current logo to be removed', async () => {
    renderPage({
      ...employer,
      employer_profile: { company_name: 'Acme Corp', company_website: null, company_logo_url: 'https://files.test/logo.png' },
    } as User);
    expect(screen.getByAltText('Company logo')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Remove my logo' }));
    expect(screen.getByText('Logo will be removed')).toBeInTheDocument();
    await save();
    await screen.findByRole('status');
    expect(sentForm().get('remove_logo')).toBe('1');
  });
});
