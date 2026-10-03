import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft} from 'lucide-react';
import { getJob, getJobApplications, updateApplicationStatus } from '../../api/client';
import ApplicantCard from './ApplicantCard';
import type { ApplicationStatus} from '../../types';
import Card from '../../components/Card';


const JobApplicantsPage = () => {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const queryClient = useQueryClient();

  const { data: job } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(jobId),
    enabled: !!id,
  });

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => getJobApplications(jobId),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: ApplicationStatus }) =>
      updateApplicationStatus(applicationId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] }),
  });

  const forbidden = (error as any)?.response?.status === 403;
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/employers/dashboard"
        className="text-ink/50 hover:text-ink text-sm mb-6 inline-flex items-center gap-1 transition-colors">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">Applicants</h1>
        <p className="text-ink/60 break-words">
          {job?.title}
          {!isLoading && !error && (
            <span className="text-ink/40">
              {' '}· {applications.length} total · {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      {statusMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          ⚠️ Couldn't update that status. Please try again.
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-hairline/40 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          ⚠️ {forbidden
            ? "You don't have access to this job's applicants."
            : 'Failed to load applicants.'}
        </div>
      )}

      {!isLoading && !error && applications.length === 0 && (
        <Card className="text-center py-12 text-ink/40">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">No applications yet.</p>
        </Card>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicantCard
              key={app.id}
              app={app}
              busy={statusMutation.isPending && statusMutation.variables?.applicationId === app.id}
              onStatusChange={(applicationId, status) =>
                statusMutation.mutate({ applicationId, status })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobApplicantsPage;