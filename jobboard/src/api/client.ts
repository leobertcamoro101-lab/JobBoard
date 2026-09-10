import axios from 'axios';
import type { Job, JobFilters } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Jobs
export const getJobs = (filters?: JobFilters) =>
  api.get<Job[]>('/jobs', { params: filters }).then(r => r.data);

export const getJob = (id: number) =>
  api.get<Job>(`/jobs/${id}`).then(r => r.data);

export const createJob = (data: Partial<Job>) =>
  api.post<Job>('/jobs', data).then(r => r.data);

// Applications
export const applyForJob = (jobId: number, data: object) =>
  api.post(`/jobs/${jobId}/apply`, data).then(r => r.data);

export default api;
