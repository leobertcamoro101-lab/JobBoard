export type UserRole = 'applicant' | 'employer';

export interface User {
  id: number;
  role: UserRole;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  mobile_number: string;
  email_verified_at: string | null;
  applicant_profile?: ApplicantProfile | null;
  employer_profile?: EmployerProfile | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicantProfile {
  resume_url: string | null;
  allow_view: boolean;
}

export interface EmployerProfile {
  company_name: string;
  company_website: string | null;
  company_logo_url: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface ApplicantRegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
}

export interface EmployerRegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  companyName: string;
  companyWebsite?: string;
}

export interface RegisterStep1Response {
  message: string;
  email: string;
}

export interface ConfirmSignupPayload {
  email: string;
  code: string;
  file?: File | null;        // resume (applicant) or logo (employer)
  allowView?: boolean;       // applicant only
}

export interface ResendCodePayload {
  email: string;
}

// Job-related types (unchanged from earlier work)
export type JobType = 'full-time' | 'part-time' | 'remote' | 'contract';

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  company: string;
  location: string;
  type: JobType;
  category: string;
  description: string;
  requirements: string | null;
  salary_min: string | null;
  salary_max: string | null;
  currency: string;
  apply_email: string;
  applications_count?: number;
  created_at: string;
  updated_at: string;
}

export interface JobFilters {
  search?: string;
  type?: string;
  category?: string;
}