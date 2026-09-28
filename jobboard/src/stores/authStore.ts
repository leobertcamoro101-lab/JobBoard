import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as apiLogin,
  logout as apiLogout,
  getMe as apiGetMe,
  registerApplicant as apiRegisterApplicant,
  confirmApplicantSignup as apiConfirmApplicantSignup,
  registerEmployer as apiRegisterEmployer,
  confirmEmployerSignup as apiConfirmEmployerSignup,
  resendConfirmationCode as apiResendCode,
} from '../api/client';
import { setUnauthorizedHandler } from '../api/auth-bridge';
import type {
  User, LoginPayload, ApplicantRegisterPayload, EmployerRegisterPayload,
  ConfirmSignupPayload, ResendCodePayload,
} from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (credentials: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  registerApplicant: (data: ApplicantRegisterPayload) => Promise<{ email: string }>;
  confirmApplicantSignup: (data: ConfirmSignupPayload) => Promise<User>;

  registerEmployer: (data: EmployerRegisterPayload) => Promise<{ email: string }>;
  confirmEmployerSignup: (data: ConfirmSignupPayload) => Promise<User>;

  resendCode: (data: ResendCodePayload) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const { data } = await apiLogin(credentials);
        localStorage.setItem('token', data.token);
        set({ user: data.user, token: data.token, isAuthenticated: true });
        return data.user;
      },

      logout: async () => {
        try { await apiLogout(); } catch { /* ignore */ }
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Re-fetch the current user (with profile) so persisted data never goes stale
      refreshUser: async () => {
        const { data } = await apiGetMe();
        set({ user: data });
      },

      // Step 1 doesn't authenticate — account isn't verified yet
      registerApplicant: async (data) => {
        const { data: res } = await apiRegisterApplicant(data);
        return { email: res.email };
      },

      // Step 2 confirms the code + uploads resume — this is what actually logs them in
      confirmApplicantSignup: async (data) => {
        const { data: res } = await apiConfirmApplicantSignup(data);
        localStorage.setItem('token', res.token);
        set({ user: res.user, token: res.token, isAuthenticated: true });
        return res.user;
      },

      registerEmployer: async (data) => {
        const { data: res } = await apiRegisterEmployer(data);
        return { email: res.email };
      },

      confirmEmployerSignup: async (data) => {
        const { data: res } = await apiConfirmEmployerSignup(data);
        localStorage.setItem('token', res.token);
        set({ user: res.user, token: res.token, isAuthenticated: true });
        return res.user;
      },

      resendCode: async (data) => {
        await apiResendCode(data);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// When any API call comes back 401 with a token, wipe in-memory auth state
// so the Navbar and ProtectedRoute react immediately, not on the next reload.
setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});