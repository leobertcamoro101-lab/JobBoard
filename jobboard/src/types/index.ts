export type JobType = 'full-time' | 'part-time' | 'remote' | 'contract';

export interface Job {
  id: number;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  type: JobType;
  salary_min: string | null;
  salary_max: string | null;
  currency: string;
  description: string;
  requirements: string | null;
  apply_email: string;
  is_active: boolean;
  category: string;
  applications_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  job_id: number;
  name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  portfolio: string | null;
  cover_letter: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  created_at: string;
}

export interface JobFilters {
  search?: string;
  type?: string;
  category?: string;
  location?: string;
}
