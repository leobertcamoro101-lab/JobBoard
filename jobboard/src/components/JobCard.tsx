import { Link } from 'react-router-dom';
import type { Job } from '../types';

const TYPE_COLORS = {
  'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'remote': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'contract': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const JobCard = ({ job }: { job: Job }) => {
  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    const min = job.salary_min ? Number(job.salary_min).toLocaleString() : null;
    const max = job.salary_max ? Number(job.salary_max).toLocaleString() : null;
    if (min && max) return `${job.currency} ${min} – ${max}`;
    if (min) return `${job.currency} ${min}+`;
    return `Up to ${job.currency} ${max}`;
  };

  const salary = formatSalary();
  const postedDate = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <Link to={`/jobs/${job.id}`}
      className="block bg-gray-800/50 border border-gray-700/50 hover:border-violet-400/50
                 hover:bg-gray-800 rounded-2xl p-5 sm:p-6 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center
                        text-xl font-bold text-white shrink-0">
          {job.company.charAt(0)}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize shrink-0
                          ${TYPE_COLORS[job.type]}`}>
          {job.type}
        </span>
      </div>

      <h2 className="text-white font-bold text-lg mb-1 group-hover:text-violet-300 transition-colors
                     leading-tight">
        {job.title}
      </h2>
      <p className="text-gray-400 text-sm mb-1">{job.company}</p>
      <p className="text-gray-500 text-xs mb-4">📍 {job.location}</p>

      <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
        {job.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="bg-gray-700/50 text-gray-400 text-xs px-2 py-1 rounded-lg">
            {job.category}
          </span>
          {salary && (
            <span className="bg-gray-700/50 text-gray-300 text-xs px-2 py-1 rounded-lg font-medium">
              💰 {salary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
          {job.applications_count !== undefined && (
            <span>👥 {job.applications_count} applied</span>
          )}
          <span>{postedDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
