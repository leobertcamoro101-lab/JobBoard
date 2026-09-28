import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, FileText, Mail, Phone } from 'lucide-react';
import { getJob, getJobApplications, updateApplicationStatus } from '../../api/client';
import type { ApplicationStatus, EmployerApplication } from '../../types';

const STATUS_OPTIONS: ApplicationStatus[] = ['pending', 'reviewed', 'accepted', 'rejected'];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-evergreen/10 text-evergreen border-evergreen/20',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const CoverLetter = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 240;

  return (
    <div>
      <p className="text-ink/70 text-sm leading-relaxed whitespace-pre-line break-words">
        {expanded || !isLong ? text : `${text.slice(0, 240)}…`}
      </p>
      {isLong && (
        <button type="button" onClick={() => setExpanded((v) => !v)}
          className="text-evergreen hover:text-evergreen-dark text-xs font-medium mt-1">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

interface CardProps {
  app: EmployerApplication;
  busy: boolean;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
}

const ApplicantCard = ({ app, busy, onStatusChange }: CardProps) => {
  const applied = new Date(app.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const linkClass = 'inline-flex items-center gap-1 text-evergreen hover:text-evergreen-dark text-sm font-medium';

  return (
    <div className="bg-white border border-hairline rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-ink font-bold break-words">{app.name}</h3>
          <p className="text-ink/40 text-xs">Applied {applied}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_STYLES[app.status]}`}>
            {app.status}
          </span>
          <select value={app.status} disabled={busy}
            onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
            aria-label={`Change status for ${app.name}`}
            className="bg-paper border border-hairline text-ink text-xs rounded-xl px-3 py-2
                       outline-none focus:border-evergreen transition-colors disabled:opacity-50">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
        <a href={`mailto:${app.email}`} className={`${linkClass} break-all`}>
          <Mail size={14} /> {app.email}
        </a>
        {app.phone && (
          <a href={`tel:${app.phone}`} className={linkClass}>
            <Phone size={14} /> {app.phone}
          </a>
        )}
        {app.linkedin && (
          <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <ExternalLink size={14} /> LinkedIn
          </a>
        )}
        {app.portfolio && (
          <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <ExternalLink size={14} /> Portfolio
          </a>
        )}
        {app.resume_url && (
          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <FileText size={14} /> Resume
          </a>
        )}
      </div>

      <CoverLetter text={app.cover_letter} />
    </div>
  );
};

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
        <div className="bg-white border border-hairline rounded-2xl text-center py-12 text-ink/40">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">No applications yet.</p>
        </div>
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