import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { getMyApplications } from '../../api/client';
import { FileText, Briefcase, Clock } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-evergreen/10 text-evergreen border-evergreen/20',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const ApplicantDashboard = () => {
  const user = useAuthStore((s) => s.user);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: getMyApplications,
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">
          Welcome back, {user?.first_name || user?.name}
        </h1>
        <p className="text-ink/60">Here's what's happening with your applications.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-hairline rounded-2xl p-5">
          <div className="flex items-center gap-2 text-ink/50 text-sm mb-2">
            <Briefcase size={16} /> Applications Sent
          </div>
          <p className="text-2xl font-bold text-ink">{applications.length}</p>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-5">
          <div className="flex items-center gap-2 text-ink/50 text-sm mb-2">
            <Clock size={16} /> Pending Review
          </div>
          <p className="text-2xl font-bold text-ink">{pendingCount}</p>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-5">
          <div className="flex items-center gap-2 text-ink/50 text-sm mb-2">
            <FileText size={16} /> Resume Status
          </div>
          <p className="text-sm font-medium text-evergreen">
            {user?.applicant_profile?.resume_url ? 'Uploaded' : 'Not uploaded'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-2xl p-6">
        <h2 className="text-ink font-bold text-lg mb-4">Your Applications</h2>

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-hairline/40 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && applications.length === 0 && (
          <div className="text-center py-10 text-ink/40">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">You haven't applied to any jobs yet.</p>
          </div>
        )}

        {!isLoading && applications.length > 0 && (
          <div className="divide-y divide-hairline">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-ink font-medium text-sm truncate">{app.job_title}</p>
                  <p className="text-ink/50 text-xs">{app.company}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize shrink-0 ${STATUS_STYLES[app.status]}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantDashboard;