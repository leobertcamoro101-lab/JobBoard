import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applyForJob } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import type { Job } from '../../types';
import Modal from '../../components/Modal';
import ApplicantIdentityField from '../../components/ApplicantIdentityField';
import { guestSchema, applicantSchema, type ApplyForm } from '../../schemas/applySchema';

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
    resolver: zodResolver(isApplicant ? applicantSchema : guestSchema),
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

  return (
    <>
      <Modal onClose={onClose} maxWidth="max-w-lg">
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
            <ApplicantIdentityField
              user={user}
              location={location}
              register={register}
              errors={errors}
              inputClass={inputClass}
            />

            <div>
              <label className="text-xs text-ink/60 mb-1 block">Phone</label>
              <input {...register('phone')} placeholder="+63 912 345 6789" className={inputClass()} />
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
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
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
      </Modal>
    </>
  );
};

export default ApplyModal;