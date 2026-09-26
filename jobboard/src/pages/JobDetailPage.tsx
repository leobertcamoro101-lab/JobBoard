import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJob } from '../api/client';
import ApplyModal from '../components/ApplyModal';

const TYPE_COLORS: Record<string, string> = {
  'full-time': 'bg-evergreen/10 text-evergreen border-evergreen/20',
  'part-time': 'bg-blue-50 text-blue-700 border-blue-200',
  'remote': 'bg-violet-50 text-violet-700 border-violet-200',
  'contract': 'bg-orange-50 text-orange-700 border-orange-200',
};

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [showApply, setShowApply] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-4">
      <div className="h-8 bg-hairline/60 rounded w-2/3" />
      <div className="h-4 bg-hairline/60 rounded w-1/3" />
      <div className="h-64 bg-hairline/50 rounded-2xl" />
    </div>
  );

  if (error || !job) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
        ⚠️ Job not found.
      </div>
    </div>
  );

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return 'Not specified';
    const min = job.salary_min ? Number(job.salary_min).toLocaleString() : null;
    const max = job.salary_max ? Number(job.salary_max).toLocaleString() : null;
    if (min && max) return `${job.currency} ${min} – ${max}`;
    if (min) return `${job.currency} ${min}+`;
    return `Up to ${job.currency} ${max}`;
  };

  const requirements = job.requirements
    ? job.requirements.split('\\n').filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="text-ink/50 hover:text-ink text-sm mb-6 inline-flex
                               items-center gap-1 transition-colors">
        ← Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-hairline rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-evergreen/10 rounded-xl flex items-center justify-center
                              text-2xl font-bold text-evergreen shrink-0">
                {job.company.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-ink mb-1">{job.title}</h1>
                <p className="text-ink/60">{job.company}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize
                                    ${TYPE_COLORS[job.type]}`}>
                    {job.type}
                  </span>
                  <span className="bg-hairline/50 text-ink/70 text-xs px-2.5 py-1 rounded-full">
                    {job.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 space-y-2 text-sm text-ink/60">
              <p>📍 {job.location}</p>
              <p>💰 {formatSalary()}</p>
              <p>👥 {job.applications_count || 0} applicants</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-hairline rounded-2xl p-6">
            <h2 className="text-ink font-bold text-lg mb-4">About This Role</h2>
            <p className="text-ink/60 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="bg-white border border-hairline rounded-2xl p-6">
              <h2 className="text-ink font-bold text-lg mb-4">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-ink/60 text-sm">
                    <span className="text-evergreen mt-0.5">▸</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-hairline rounded-2xl p-5 sticky top-24">
            <button
              onClick={() => setShowApply(true)}
              className="w-full bg-evergreen hover:bg-evergreen-dark text-white font-bold
                         py-3 rounded-xl transition-colors mb-3">
              Apply Now →
            </button>
            <p className="text-ink/40 text-xs text-center">
              Applications sent to {job.apply_email}
            </p>
          </div>
        </div>
      </div>

      {showApply && (
        <ApplyModal job={job} onClose={() => setShowApply(false)} />
      )}
    </div>
  );
};

export default JobDetailPage;