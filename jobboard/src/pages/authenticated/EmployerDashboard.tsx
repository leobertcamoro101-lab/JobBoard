import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { getEmployerJobs } from '../../api/client';
import { Briefcase, Users, Eye } from 'lucide-react';

const EmployerDashboard = () => {
  const user = useAuthStore((s) => s.user);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: getEmployerJobs,
  });

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants_count || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">
            {user?.employer_profile?.company_name || 'Your Company'}
          </h1>
          <p className="text-ink/60">Manage your job postings and applicants.</p>
        </div>
        <Link to="/post"
          className="bg-evergreen hover:bg-evergreen-dark text-white text-sm font-bold
                     px-4 py-2.5 rounded-xl transition-colors text-center shrink-0">
          + Post a Job
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-hairline rounded-2xl p-5">
          <div className="flex items-center gap-2 text-ink/50 text-sm mb-2">
            <Briefcase size={16} /> Active Job Posts
          </div>
          <p className="text-2xl font-bold text-ink">{jobs.length}</p>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-5">
          <div className="flex items-center gap-2 text-ink/50 text-sm mb-2">
            <Users size={16} /> Total Applicants
          </div>
          <p className="text-2xl font-bold text-ink">{totalApplicants}</p>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-5">
          <div className="flex items-center gap-2 text-ink/50 text-sm mb-2">
            <Eye size={16} /> Profile Views
          </div>
          <p className="text-2xl font-bold text-ink">0</p>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-2xl p-6">
        <h2 className="text-ink font-bold text-lg mb-4">Your Job Posts</h2>

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-hairline/40 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="text-center py-10 text-ink/40">
            <p className="text-3xl mb-2">💼</p>
            <p className="text-sm mb-4">You haven't posted any jobs yet.</p>
            <Link to="/post" className="text-evergreen font-medium text-sm hover:text-evergreen-dark">
              Post your first job →
            </Link>
          </div>
        )}

        {!isLoading && jobs.length > 0 && (
          <div className="divide-y divide-hairline">
            {jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:bg-paper/60 -mx-2 px-2 rounded-lg transition-colors">
                <div className="min-w-0">
                  <p className="text-ink font-medium text-sm truncate">{job.title}</p>
                  <p className="text-ink/50 text-xs">{job.location}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-evergreen/10 text-evergreen font-medium shrink-0">
                  {job.applicants_count} applicant{job.applicants_count !== 1 ? 's' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;