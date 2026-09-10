import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJob } from '../api/client';
import ApplyModal from '../components/ApplyModal';

const TYPE_COLORS: Record<string, string> = {
  'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'remote': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'contract': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
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
      <div className="h-8 bg-gray-800 rounded w-2/3" />
      <div className="h-4 bg-gray-800 rounded w-1/3" />
      <div className="h-64 bg-gray-800 rounded-2xl" />
    </div>
  );

  if (error || !job) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4">
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
      <Link to="/" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex
                               items-center gap-1 transition-colors">
        ← Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center
                              text-2xl font-bold text-white shrink-0">
                {job.company.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
                <p className="text-gray-400">{job.company}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize
                                    ${TYPE_COLORS[job.type]}`}>
                    {job.type}
                  </span>
                  <span className="bg-gray-700/50 text-gray-400 text-xs px-2.5 py-1 rounded-full">
                    {job.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-2 text-sm text-gray-400">
              <p>📍 {job.location}</p>
              <p>💰 {formatSalary()}</p>
              <p>👥 {job.applications_count || 0} applicants</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">About This Role</h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-400 text-sm">
                    <span className="text-violet-400 mt-0.5">▸</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 sticky top-24">
            <button
              onClick={() => setShowApply(true)}
              className="w-full bg-violet-500 hover:bg-violet-400 text-white font-bold
                         py-3 rounded-xl transition-colors mb-3">
              Apply Now →
            </button>
            <p className="text-gray-500 text-xs text-center">
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
