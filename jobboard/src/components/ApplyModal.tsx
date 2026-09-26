import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { applyForJob } from '../api/client';
import type { Job } from '../types';

const applySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  cover_letter: z.string().min(100, 'Cover letter must be at least 100 characters'),
});

type ApplyForm = z.infer<typeof applySchema>;

interface Props {
  job: Job;
  onClose: () => void;
}

const ApplyModal = ({ job, onClose }: Props) => {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ApplyForm) => applyForJob(job.id, data),
    onSuccess: () => setSubmitted(true),
  });

  const inputClass = (hasError?: boolean) =>
    `w-full bg-paper border ${hasError ? 'border-red-400' : 'border-hairline'}
     text-ink text-sm rounded-xl px-3 py-2.5 outline-none focus:border-evergreen
     transition-colors placeholder-ink/40`;

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-hairline rounded-2xl w-full max-w-lg
                        max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-6 border-b border-hairline flex items-center justify-between">
            <div>
              <h2 className="text-ink font-bold text-lg">Apply for {job.title}</h2>
              <p className="text-ink/60 text-sm">{job.company}</p>
            </div>
            <button onClick={onClose} className="text-ink/40 hover:text-ink text-2xl">×</button>
          </div>

          {submitted ? (
            <div className="p-8 text-center">
              <p className="text-5xl mb-4">🎉</p>
              <h3 className="text-ink font-bold text-xl mb-2">Application Submitted!</h3>
              <p className="text-ink/60 mb-6">Good luck! You'll hear back at {job.apply_email}</p>
              <button onClick={onClose}
                className="bg-evergreen hover:bg-evergreen-dark text-white font-bold
                           px-8 py-3 rounded-xl transition-colors">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
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