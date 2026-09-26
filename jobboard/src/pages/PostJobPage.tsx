import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { createJob } from '../api/client';

const postJobSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
  company: z.string().min(2, 'Company name is required'),
  location: z.string().min(2, 'Location is required'),
  type: z.enum(['full-time', 'part-time', 'remote', 'contract']),
  category: z.string().min(1, 'Category is required'),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  currency: z.string().min(1).default('PHP'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  requirements: z.string().optional(),
  apply_email: z.string().email('Valid email required'),
});

type PostJobForm = z.infer<typeof postJobSchema>;

const CATEGORIES = ['Engineering', 'Design', 'DevOps', 'Marketing', 'Sales', 'Product'];

const PostJobPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<PostJobForm>({
    resolver: zodResolver(postJobSchema) as any,
    defaultValues: { 
      type: 'full-time', 
      currency: 'PHP', 
      category: 'Engineering', 
      title: '', 
      company: '', 
      location: '', 
      description: '', 
      apply_email: '' },
  });

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: (job) => navigate(`/jobs/${job.id}`),
  });

  const inputClass = (hasError?: boolean) =>
    `w-full bg-paper border ${hasError ? 'border-red-400' : 'border-hairline'}
     text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
     transition-colors placeholder-ink/40`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">Post a Job</h1>
        <p className="text-ink/60">Find your next great hire</p>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        <div className="bg-white border border-hairline rounded-2xl p-6 space-y-4">
          <h2 className="text-ink font-bold">Job Details</h2>

          <div>
            <label className="text-xs text-ink/60 mb-1 block">Job Title *</label>
            <input {...register('title')} placeholder="e.g. Senior React Developer"
              className={inputClass(!!errors.title)} />
            {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Company *</label>
              <input {...register('company')} placeholder="Your company name"
                className={inputClass(!!errors.company)} />
              {errors.company && <p className="text-red-600 text-xs mt-1">{errors.company.message}</p>}
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Location *</label>
              <input {...register('location')} placeholder="e.g. Cebu City or Remote"
                className={inputClass(!!errors.location)} />
              {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Job Type *</label>
              <select {...register('type')} className={inputClass()}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="remote">Remote</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Category *</label>
              <select {...register('category')} className={inputClass()}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-6 space-y-4">
          <h2 className="text-ink font-bold">Salary (Optional)</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Currency</label>
              <select {...register('currency')} className={inputClass()}>
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Min Salary</label>
              <input {...register('salary_min')} placeholder="e.g. 50000"
                className={inputClass()} />
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Max Salary</label>
              <input {...register('salary_max')} placeholder="e.g. 80000"
                className={inputClass()} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-6 space-y-4">
          <h2 className="text-ink font-bold">Description</h2>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Job Description *</label>
            <textarea {...register('description')} rows={6}
              placeholder="Describe the role, responsibilities, and what makes it exciting..."
              className={`${inputClass(!!errors.description)} resize-none`} />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">
              Requirements <span className="text-ink/40">(one per line)</span>
            </label>
            <textarea {...register('requirements')} rows={4}
              placeholder="5+ years React experience&#10;TypeScript proficiency&#10;..."
              className={`${inputClass()} resize-none`} />
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-6">
          <h2 className="text-ink font-bold mb-4">Contact</h2>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Application Email *</label>
            <input {...register('apply_email')} type="email" placeholder="jobs@yourcompany.com"
              className={inputClass(!!errors.apply_email)} />
            {errors.apply_email && <p className="text-red-600 text-xs mt-1">{errors.apply_email.message}</p>}
          </div>
        </div>

        {mutation.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            ⚠️ Failed to post job. Please try again.
          </div>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                     text-white font-bold py-4 rounded-2xl transition-colors text-lg">
          {mutation.isPending ? 'Posting...' : 'Post Job →'}
        </button>
      </form>
    </div>
  );
};

export default PostJobPage;