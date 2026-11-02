import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notifyUnauthorized: vi.fn(),
  notifyLoadingStart: vi.fn(),
  notifyLoadingStop: vi.fn(),
}));

vi.mock('./auth-bridge', () => ({ notifyUnauthorized: mocks.notifyUnauthorized }));
vi.mock('../context/loading-bridge', () => ({
  notifyLoadingStart: mocks.notifyLoadingStart,
  notifyLoadingStop: mocks.notifyLoadingStop,
}));

import api, {
  applyForJob,
  changePassword,
  confirmApplicantSignup,
  confirmEmployerSignup,
  deleteJob,
  getJob,
  getJobs,
  login,
  updateApplicationStatus,
  updateProfile,
} from './client';

// Replace the network with a fake adapter. Requests still pass through every interceptor,
// so these tests exercise the real client.ts wiring and never touch a server.
let sent: InternalAxiosRequestConfig[] = [];

const reply = (status: number, data: unknown = {}) => {
  api.defaults.adapter = async (config) => {
    sent.push(config);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, null, response);
  };
};

const lastRequest = () => sent[sent.length - 1];
const formEntries = (config: InternalAxiosRequestConfig) =>
  Object.fromEntries((config.data as FormData).entries());

// jsdom can't navigate, so swap in a plain object we can inspect.
const fakeLocation = (pathname: string) => {
  const loc = { pathname, href: `http://localhost${pathname}` };
  vi.stubGlobal('location', loc);
  return loc;
};

beforeEach(() => {
  sent = [];
  localStorage.clear();
  vi.clearAllMocks();
  reply(200);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('base URL', () => {
  it('defaults to /api and can be pointed elsewhere with VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();
    expect((await import('./client')).default.defaults.baseURL).toBe('/api');

    vi.stubEnv('VITE_API_URL', 'https://api.example.test/api');
    vi.resetModules();
    expect((await import('./client')).default.defaults.baseURL).toBe('https://api.example.test/api');
  });
});

describe('auth header', () => {
  it('sends the stored token as a Bearer header', async () => {
    localStorage.setItem('token', 'abc123');
    await api.get('/me');
    expect(lastRequest().headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('sends no Authorization header when logged out', async () => {
    await api.get('/jobs');
    expect(lastRequest().headers.get('Authorization')).toBeFalsy();
  });

  it('always asks Laravel for JSON', async () => {
    await api.get('/jobs');
    expect(lastRequest().headers.get('Accept')).toBe('application/json');
  });
});

describe('loading indicator', () => {
  it('starts and stops once for a successful request', async () => {
    await api.get('/jobs');
    expect(mocks.notifyLoadingStart).toHaveBeenCalledTimes(1);
    expect(mocks.notifyLoadingStop).toHaveBeenCalledTimes(1);
  });

  it('stops after a failed request too, so the spinner never sticks', async () => {
    reply(500);
    await expect(api.get('/jobs')).rejects.toBeInstanceOf(AxiosError);
    expect(mocks.notifyLoadingStart).toHaveBeenCalledTimes(1);
    expect(mocks.notifyLoadingStop).toHaveBeenCalledTimes(1);
  });

  it('stays out of the way for silent requests, success or failure', async () => {
    await api.get('/me', { silent: true });
    reply(500);
    await expect(api.get('/me', { silent: true })).rejects.toBeInstanceOf(AxiosError);
    expect(mocks.notifyLoadingStart).not.toHaveBeenCalled();
    expect(mocks.notifyLoadingStop).not.toHaveBeenCalled();
  });
});

describe('expired session (401 while holding a token)', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'stale');
    localStorage.setItem('auth-storage', '{"state":{}}');
    reply(401, { message: 'Unauthenticated.' });
  });

  it('clears the saved login, tells the auth store once, and still rejects the call', async () => {
    fakeLocation('/employers/dashboard');
    await expect(api.get('/me')).rejects.toMatchObject({ response: { status: 401 } });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('auth-storage')).toBeNull();
    expect(mocks.notifyUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('leaves navigation to the app instead of forcing a full page reload', async () => {
    const loc = fakeLocation('/employers/dashboard');
    await expect(api.get('/me')).rejects.toBeDefined();

    expect(loc.href).toBe('http://localhost/employers/dashboard');
  });
});

describe('other failures keep the session', () => {
  it.each([[422], [429], [500]])('a %i does not log the user out', async (status) => {
    localStorage.setItem('token', 'good');
    localStorage.setItem('auth-storage', '{"state":{}}');
    fakeLocation('/applicants/dashboard');
    reply(status);

    await expect(api.get('/me')).rejects.toMatchObject({ response: { status } });
    expect(localStorage.getItem('token')).toBe('good');
    expect(localStorage.getItem('auth-storage')).toBe('{"state":{}}');
    expect(mocks.notifyUnauthorized).not.toHaveBeenCalled();
  });

  it('a 401 with no token (not logged in) is not treated as an expired session', async () => {
    fakeLocation('/applicants');
    reply(401);
    await expect(api.get('/me')).rejects.toMatchObject({ response: { status: 401 } });
    expect(mocks.notifyUnauthorized).not.toHaveBeenCalled();
  });
});

describe('endpoints', () => {
  it('login posts the credentials', async () => {
    await login({ email: 'a@b.test', password: 'pw', remember: true });
    expect(lastRequest()).toMatchObject({ method: 'post', url: '/login' });
    expect(JSON.parse(lastRequest().data)).toEqual({ email: 'a@b.test', password: 'pw', remember: true });
  });

  it('getJobs forwards the filters as query params', async () => {
    reply(200, [{ id: 1 }]);
    const jobs = await getJobs({ search: 'react', type: 'remote' });
    expect(lastRequest()).toMatchObject({ method: 'get', url: '/jobs', params: { search: 'react', type: 'remote' } });
    expect(jobs).toEqual([{ id: 1 }]);
  });

  it('getJob, deleteJob, applyForJob and updateApplicationStatus hit the right URLs and unwrap data', async () => {
    reply(200, { id: 7 });
    expect(await getJob(7)).toEqual({ id: 7 });
    expect(lastRequest()).toMatchObject({ method: 'get', url: '/jobs/7' });

    reply(200, { message: 'Deleted' });
    expect(await deleteJob(7)).toEqual({ message: 'Deleted' });
    expect(lastRequest()).toMatchObject({ method: 'delete', url: '/jobs/7' });

    reply(200, { message: 'Applied' });
    await applyForJob(7, { name: 'Alex' });
    expect(lastRequest()).toMatchObject({ method: 'post', url: '/jobs/7/apply' });
    expect(JSON.parse(lastRequest().data)).toEqual({ name: 'Alex' });

    reply(200, { id: 3, status: 'accepted' });
    expect(await updateApplicationStatus(3, 'accepted')).toEqual({ id: 3, status: 'accepted' });
    expect(lastRequest()).toMatchObject({ method: 'patch', url: '/applications/3' });
    expect(JSON.parse(lastRequest().data)).toEqual({ status: 'accepted' });
  });

  it('changePassword PUTs the three fields and resolves with the message', async () => {
    reply(200, { message: 'Password updated' });
    const body = { current_password: 'old', password: 'new-pass-1', password_confirmation: 'new-pass-1' };
    expect(await changePassword(body)).toEqual({ message: 'Password updated' });
    expect(lastRequest()).toMatchObject({ method: 'put', url: '/profile/password' });
    expect(JSON.parse(lastRequest().data)).toEqual(body);
  });

  it('updateProfile posts the form as multipart', async () => {
    reply(200, { id: 1 });
    const form = new FormData();
    form.append('first_name', 'Alex');
    await updateProfile(form);
    expect(lastRequest()).toMatchObject({ method: 'post', url: '/profile' });
    expect(String(lastRequest().headers.get('Content-Type'))).toContain('multipart/form-data');
    expect(formEntries(lastRequest())).toEqual({ first_name: 'Alex' });
  });
});

describe('signup confirmation uploads', () => {
  const resume = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
  const logo = new File(['png'], 'logo.png', { type: 'image/png' });

  it('applicant: sends email, code, resume and allow_view as multipart', async () => {
    await confirmApplicantSignup({ email: 'a@b.test', code: '123456', file: resume, allowView: false });

    expect(lastRequest()).toMatchObject({ method: 'post', url: '/applicant/register/confirm' });
    expect(String(lastRequest().headers.get('Content-Type'))).toContain('multipart/form-data');
    const form = formEntries(lastRequest());
    expect(form).toMatchObject({ email: 'a@b.test', code: '123456', allow_view: 'false' });
    expect((form.resume as File).name).toBe('cv.pdf');
  });

  it('applicant: allow_view defaults to "true" and a missing code or file is left out', async () => {
    await confirmApplicantSignup({ email: 'a@b.test' });
    expect(formEntries(lastRequest())).toEqual({ email: 'a@b.test', allow_view: 'true' });
  });

  it('applicant: an empty code is not sent (server did not require one)', async () => {
    await confirmApplicantSignup({ email: 'a@b.test', code: '', file: resume });
    expect(formEntries(lastRequest())).not.toHaveProperty('code');
  });

  it('employer: sends the logo under "logo" and never sends allow_view', async () => {
    await confirmEmployerSignup({ email: 'hr@co.test', code: '654321', file: logo });

    expect(lastRequest()).toMatchObject({ method: 'post', url: '/employer/register/confirm' });
    const form = formEntries(lastRequest());
    expect(form).toMatchObject({ email: 'hr@co.test', code: '654321' });
    expect((form.logo as File).name).toBe('logo.png');
    expect(form).not.toHaveProperty('allow_view');
    expect(form).not.toHaveProperty('resume');
  });

  it('employer: logo and code are optional', async () => {
    await confirmEmployerSignup({ email: 'hr@co.test', file: null });
    expect(formEntries(lastRequest())).toEqual({ email: 'hr@co.test' });
  });
});

