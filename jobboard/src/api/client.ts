import axios, { type AxiosResponse } from 'axios';
import type {
  User, LoginPayload, ApplicantRegisterPayload, EmployerRegisterPayload,
  RegisterStep1Response, ConfirmSignupPayload, ResendCodePayload,
  Job, JobFilters,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token missing/expired/revoked — clear stale auth state.
    // JobBoard has two login pages (applicant/employer), so unlike a single
    // /login redirect, we just clear state and let the current page's guard
    // (or the user) decide where to go next.
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
    }
    return Promise.reject(error);
  },
);

interface AuthResponse {
  user: User;
  token: string;
}

interface MessageResponse {
  message: string;
}

// Auth — shared
export const login = (data: LoginPayload): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/login', data);
export const logout = (): Promise<AxiosResponse<MessageResponse>> => api.post('/logout');
export const getMe = (): Promise<AxiosResponse<User>> => api.get('/me');
export const resendConfirmationCode = (data: ResendCodePayload): Promise<AxiosResponse<MessageResponse>> =>
  api.post('/register/resend-code', data);

// Auth — applicant signup (2-step)
export const registerApplicant = (
  data: ApplicantRegisterPayload
): Promise<AxiosResponse<RegisterStep1Response>> => api.post('/applicant/register', data);

export const confirmApplicantSignup = (
  data: ConfirmSignupPayload
): Promise<AxiosResponse<AuthResponse>> => {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('code', data.code);
  if (data.file) formData.append('resume', data.file);
  formData.append('allow_view', String(data.allowView ?? true));
  return api.post('/applicant/register/confirm', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Auth — employer signup (2-step)
export const registerEmployer = (
  data: EmployerRegisterPayload
): Promise<AxiosResponse<RegisterStep1Response>> => api.post('/employer/register', data);

export const confirmEmployerSignup = (
  data: ConfirmSignupPayload
): Promise<AxiosResponse<AuthResponse>> => {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('code', data.code);
  if (data.file) formData.append('logo', data.file);
  return api.post('/employer/register/confirm', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Jobs
// export const getJobs = (params?: JobFilters): Promise<AxiosResponse<Job[]>> => api.get('/jobs', { params });
// export const getJob = (id: number): Promise<AxiosResponse<Job>> => api.get(`/jobs/${id}`);
// export const createJob = (data: Partial<Job>): Promise<AxiosResponse<Job>> => api.post('/jobs', data).then(r => r.data);
// export const applyForJob = (jobId: number, data: unknown): Promise<AxiosResponse<MessageResponse>> =>
//   api.post(`/jobs/${jobId}/apply`, data);
// Jobs
export const getJobs = (params?: JobFilters): Promise<Job[]> =>
  api.get('/jobs', { params }).then((res) => res.data);

export const getJob = (id: number): Promise<Job> =>
  api.get(`/jobs/${id}`).then((res) => res.data);

export const createJob = (data: Partial<Job>): Promise<Job> =>
  api.post('/jobs', data).then((res) => res.data);

export const applyForJob = (jobId: number, data: unknown): Promise<{ message: string }> =>
  api.post(`/jobs/${jobId}/apply`, data).then((res) => res.data);

export default api;