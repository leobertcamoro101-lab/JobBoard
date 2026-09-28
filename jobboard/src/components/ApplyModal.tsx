import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyForJob } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { Job } from '../types';

const optionalUrl = z.string().url('Must be a valid URL').optional().or(z.literal(''));

const sharedFields = {
  phone: z.string().optional(),
  linkedin: optionalUrl,
  portfolio: optionalUrl,
  cover_letter: z.string().min(100, 'Cover letter must be at least 100 characters'),
};

const guestSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  ...sharedFields,
});

// Logged-in applicants: name and email come from their account (the API enforces this too)
const applicantSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  ...sharedFields,
});

type ApplyForm = z.infer<typeof guestSchema>;

interface Props {
  job: Job;
  onClose: () => void;
}

const ApplyModal = ({ job, onClose }: Props) => {
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isApplicant = user?.role === 'applicant';

  const { register, handleSubmit, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(isApplicant ? applicantSchema : guestSchema) as any,
    defaultValues: {
      name: isApplicant ? (user?.name ?? '') : '',
      email: isApplicant ? (user?.email ?? '') : '',
      phone: isApplicant ? (user?.mobile_number ?? '') : '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ApplyForm) => applyForJob(job.id, data),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
    },
  });

  const inputClass = (hasError?: boolean) =>
    `w-full bg-paper border ${hasError ? 'border-red-400' : 'border-hairline'}
     text-ink text-sm rounded-xl px-3 py-2.5 outline-none focus:border-evergreen
     transition-colors placeholder-ink/40`;

  const profile = user?.applicant_profile;

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-hairline rounded-2xl w-full max-w-lg
                        max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-5 sm:p-6 border-b border-hairline flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-ink font-bold text-lg break-words">Apply for {job.title}</h2>
              <p className="text-ink/60 text-sm">{job.company}</p>
            </div>
            <button onClick={onClose} className="text-ink/40 hover:text-ink text-2xl shrink-0">×</button>
          </div>

          {submitted ? (
            <div className="p-8 text-center">
              <p className="text-5xl mb-4">🎉</p>
              <h3 className="text-ink font-bold text-xl mb-2">Application Submitted!</h3>
              <p className="text-ink/60 mb-6">
                Good luck! You'll hear back at {isApplicant ? user?.email : job.apply_email}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {isApplicant && (
                  <Link to="/applicants/dashboard" onClick={onClose}
                    className="w-full sm:w-auto border border-evergreen text-evergreen hover:bg-evergreen/5
                               font-bold px-6 py-3 rounded-xl transition-colors">
                    View my applications
                  </Link>
                )}
                <button onClick={onClose}
                  className="w-full sm:w-auto bg-evergreen hover:bg-evergreen-dark text-white font-bold
                             px-8 py-3 rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-5 sm:p-6 space-y-4">
              {isApplicant ? (
                <div className="bg-paper border border-hairline rounded-xl px-4 py-3">
                  <p className="text-ink/50 text-xs mb-0.5">Applying as</p>
                  <p className="text-ink font-medium text-sm break-words">{user?.name}</p>
                  <p className="text-ink/60 text-sm break-all">{user?.email}</p>
                  {profile?.resume_url && (
                    <p className="text-ink/50 text-xs mt-2">
                      {profile.allow_view
                        ? 'Your uploaded resume will be visible to this employer.'
                        : 'Your resume is set to private, so this employer won’t see it.'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {!user && (
                    <p className="text-ink/60 text-xs">
                      Have an account?{' '}
                      <Link to="/applicants" state={{ from: location }}
                        className="text-evergreen hover:text-evergreen-dark font-medium">
                        Log in
                      </Link>{' '}
                      to apply faster.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-ink/60 mb-1 block">Full Name *</label>
                      <input {...register('name')} placeholder="John Doe"
                        className={inputClass(!!errors.name)} />
                      {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-ink/60 mb-1 block">Email *</label>
                      <input {...register('email')} type="email" placeholder="john@example.com"
                        className={inputClass(!!errors.email)} />
                      {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-ink/60 mb-1 block">Phone</label>
                <input {...register('phone')} placeholder="+63 912 345 6789"
                  className={inputClass()} />
              </div>

              <div>
                <label className="text-xs text-ink/60 mb-1 block">LinkedIn URL</label>
                <input {...register('linkedin')} placeholder="https://linkedin.com/in/..."
                  className={inputClass(!!errors.linkedin)} />
                {errors.linkedin && <p className="text-red-600 text-xs mt-1">{errors.linkedin.message}</p>}
              </div>

              <div>
                <label className="text-xs text-ink/60 mb-1 block">Portfolio URL</label>
                <input {...register('portfolio')} placeholder="https://yoursite.com"
                  className={inputClass(!!errors.portfolio)} />
                {errors.portfolio && <p className="text-red-600 text-xs mt-1">{errors.portfolio.message}</p>}
              </div>

              <div>
                <label className="text-xs text-ink/60 mb-1 block">
                  Cover Letter * <span className="text-ink/40">(min 100 chars)</span>
                </label>
                <textarea {...register('cover_letter')} rows={6}
                  placeholder="Tell us why you're a great fit for this role..."
                  className={`${inputClass(!!errors.cover_letter)} resize-none`} />
                {errors.cover_letter && (
                  <p className="text-red-600 text-xs mt-1">{errors.cover_letter.message}</p>
                )}
              </div>

              {mutation.error && (
                <div className="bg-red-50 border border-red-200 text-red-700
                                rounded-xl px-4 py-3 text-sm">
                  ⚠️ {(mutation.error as any)?.response?.data?.message || 'Failed to submit'}
                </div>
              )}

              <button type="submit" disabled={mutation.isPending}
                className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                           text-white font-bold py-3 rounded-xl transition-colors">
                {mutation.isPending ? 'Submitting...' : 'Submit Application →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ApplyModal;