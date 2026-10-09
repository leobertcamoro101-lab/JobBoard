import axios, { type AxiosResponse } from 'axios';
import type { Application, EmployerJob, EmployerApplication, ApplicationStatus } from '../types';
import { notifyUnauthorized } from './auth-bridge';
import { notifyLoadingStart, notifyLoadingStop } from '../context/loading-bridge';

// Lets a request opt out of the global loading indicator — used by the
// background session-expiry ping so it doesn't flash the spinner on every check.
declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean;
  }
}

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
    // Only treat a 401 as "session expired" if we actually sent a token.
    // (Bad-credential logins return 422 from Laravel, so they never reach this.)
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      notifyUnauthorized();
    }
    return Promise.reject(error);
  },
);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
api.interceptors.request.use((config) => {
  if (!config.silent) notifyLoadingStart();
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (!response.config.silent) notifyLoadingStop();
    return response;
  },
  (error) => {
    if (!error.config?.silent) notifyLoadingStop();

    // Token missing/expired/revoked — clear stale auth state and send the user back to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
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
  if (data.code) formData.append('code', data.code);
  // formData.append('code', data.code);
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
  if (data.code) formData.append('code', data.code);
  // formData.append('code', data.code);
  if (data.file) formData.append('logo', data.file);
  return api.post('/employer/register/confirm', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMyApplications = (): Promise<Application[]> =>
  api.get('/applicant/applications').then((res) => res.data);

export const getEmployerJobs = (): Promise<EmployerJob[]> =>
  api.get('/employer/jobs').then((res) => res.data);

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
export const updateJob = (id: number, data: Partial<Job>): Promise<Job> =>
  api.put(`/jobs/${id}`, data).then((res) => res.data);

export const deleteJob = (id: number): Promise<{ message: string }> =>
  api.delete(`/jobs/${id}`).then((res) => res.data);

export const getJobApplications = (jobId: number): Promise<EmployerApplication[]> =>
  api.get(`/jobs/${jobId}/applications`).then((res) => res.data);

export const updateApplicationStatus = (
  id: number,
  status: ApplicationStatus
): Promise<{ id: number; status: ApplicationStatus }> =>
  api.patch(`/applications/${id}`, { status }).then((res) => res.data);

export default api;