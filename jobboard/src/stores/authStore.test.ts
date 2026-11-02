import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api/client';
import { useAuthStore } from './authStore';

const captured = vi.hoisted(() => ({ onUnauthorized: undefined as undefined | (() => void) }));

vi.mock('../api/auth-bridge', () => ({
  setUnauthorizedHandler: (fn: () => void) => {
    captured.onUnauthorized = fn;
  },
}));
vi.mock('../api/client', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  registerApplicant: vi.fn(),
  confirmApplicantSignup: vi.fn(),
  registerEmployer: vi.fn(),
  confirmEmployerSignup: vi.fn(),
  resendConfirmationCode: vi.fn(),
}));

const user = { id: 1, role: 'applicant', name: 'Alex Applicant', email: 'alex@example.test' };
const signedOut = { user: null, token: null, isAuthenticated: false };

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState(signedOut);
  });

  describe('login', () => {
    it('stores the user and token, and returns the user', async () => {
      vi.mocked(api.login).mockResolvedValue({ data: { token: 'tok', user } } as never);

      const result = await useAuthStore.getState().login({ email: 'alex@example.test', password: 'pw' });

      expect(result).toEqual(user);
      expect(useAuthStore.getState()).toMatchObject({ user, token: 'tok', isAuthenticated: true });
      expect(localStorage.getItem('token')).toBe('tok');
    });

    it('rejects and leaves the store signed out when the API refuses', async () => {
      vi.mocked(api.login).mockRejectedValue(new Error('401'));

      await expect(useAuthStore.getState().login({ email: 'a@b.test', password: 'bad' })).rejects.toThrow('401');

      expect(useAuthStore.getState()).toMatchObject(signedOut);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears the store and the token', async () => {
      useAuthStore.setState({ user: user as never, token: 'tok', isAuthenticated: true });
      localStorage.setItem('token', 'tok');
      vi.mocked(api.logout).mockResolvedValue({} as never);

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState()).toMatchObject(signedOut);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('still signs out locally when the API call fails', async () => {
      useAuthStore.setState({ user: user as never, token: 'tok', isAuthenticated: true });
      localStorage.setItem('token', 'tok');
      vi.mocked(api.logout).mockRejectedValue(new Error('offline'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState()).toMatchObject(signedOut);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('refreshUser replaces the stored user with the server’s copy', async () => {
    useAuthStore.setState({ user: user as never, token: 'tok', isAuthenticated: true });
    const fresh = { ...user, name: 'Alex Renamed' };
    vi.mocked(api.getMe).mockResolvedValue({ data: fresh } as never);

    await useAuthStore.getState().refreshUser();

    expect(useAuthStore.getState().user).toEqual(fresh);
    expect(useAuthStore.getState().token).toBe('tok');
  });

  describe.each([
    ['applicant', 'registerApplicant', 'confirmApplicantSignup'],
    ['employer', 'registerEmployer', 'confirmEmployerSignup'],
  ] as const)('%s signup', (_role, registerName, confirmName) => {
    it('step 1 returns the email and does not sign anyone in', async () => {
      vi.mocked(api[registerName]).mockResolvedValue({ data: { email: 'new@example.test', requires_code: true } } as never);

      const result = await useAuthStore.getState()[registerName]({} as never);

      expect(result).toEqual({ email: 'new@example.test', requiresCode: true });
      expect(useAuthStore.getState()).toMatchObject(signedOut);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('step 1 reports when no code is needed, and assumes one is when the API is silent', async () => {
      vi.mocked(api[registerName]).mockResolvedValueOnce({ data: { email: 'a@b.test', requires_code: false } } as never);
      expect((await useAuthStore.getState()[registerName]({} as never)).requiresCode).toBe(false);

      vi.mocked(api[registerName]).mockResolvedValueOnce({ data: { email: 'a@b.test' } } as never);
      expect((await useAuthStore.getState()[registerName]({} as never)).requiresCode).toBe(true);
    });

    it('step 2 signs the new user in', async () => {
      vi.mocked(api[confirmName]).mockResolvedValue({ data: { token: 'new-tok', user } } as never);

      const result = await useAuthStore.getState()[confirmName]({ email: 'a@b.test', code: '123456' });

      expect(result).toEqual(user);
      expect(useAuthStore.getState()).toMatchObject({ user, token: 'new-tok', isAuthenticated: true });
      expect(localStorage.getItem('token')).toBe('new-tok');
    });
  });

  it('resendCode passes the email to the API', async () => {
    vi.mocked(api.resendConfirmationCode).mockResolvedValue({} as never);
    await useAuthStore.getState().resendCode({ email: 'a@b.test' });
    expect(api.resendConfirmationCode).toHaveBeenCalledWith({ email: 'a@b.test' });
  });

  it('wipes the signed-in state when the API reports 401', () => {
    useAuthStore.setState({ user: user as never, token: 'tok', isAuthenticated: true });

    captured.onUnauthorized?.();

    expect(useAuthStore.getState()).toMatchObject(signedOut);
  });

  it('persists only the user, token and flag, not the actions', () => {
    useAuthStore.setState({ user: user as never, token: 'tok', isAuthenticated: true });

    const saved = JSON.parse(localStorage.getItem('auth-storage') ?? '{}');

    expect(Object.keys(saved.state).sort()).toEqual(['isAuthenticated', 'token', 'user']);
  });
});
