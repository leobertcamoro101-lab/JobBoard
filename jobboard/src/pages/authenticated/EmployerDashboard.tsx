import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Users, Eye, Pencil, Lock, Unlock, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getEmployerJobs, updateJob, deleteJob } from '../../api/client';
import type { EmployerJob } from '../../types';

const actionBtn =
  'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-hairline ' +
  'text-ink/70 hover:bg-paper hover:text-ink transition-colors disabled:opacity-50';

const EmployerDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<EmployerJob | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: getEmployerJobs,
  });

  const refreshJobs = () => {
    queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['job'] });
  };

  const toggleMutation = useMutation({
    mutationFn: (job: EmployerJob) => updateJob(job.id, { is_active: !job.is_active }),
    onSuccess: refreshJobs,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteJob(id),
    onSuccess: () => {
      setDeleteTarget(null);
      refreshJobs();
    },
  });

  const activeCount = jobs.filter((j) => j.is_active).length;
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
          <p className="text-2xl font-bold text-ink">{activeCount}</p>
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

      <div className="bg-white border border-hairline rounded-2xl p-5 sm:p-6">
        <h2 className="text-ink font-bold text-lg mb-4">Your Job Posts</h2>

        {toggleMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            ⚠️ Couldn't update that job. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-hairline/40 rounded-xl" />
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
            {jobs.map((job) => {
              const toggling = toggleMutation.isPending && toggleMutation.variables?.id === job.id;

              return (
                <div key={job.id}
                  className="py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/jobs/${job.id}`}
                        className="text-ink font-medium text-sm hover:text-evergreen transition-colors">
                        {job.title}
                      </Link>
                      {!job.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-hairline text-ink/60 font-medium">
                          Closed
                        </span>
                      )}
                    </div>
                    <p className="text-ink/50 text-xs">{job.location}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/employers/jobs/${job.id}/applicants`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                                 bg-evergreen/10 text-evergreen hover:bg-evergreen/20 transition-colors">
                      <Users size={14} />
                      {job.applicants_count} applicant{job.applicants_count !== 1 ? 's' : ''}
                    </Link>
                    <Link to={`/employers/jobs/${job.id}/edit`} className={actionBtn}>
                      <Pencil size={14} /> Edit
                    </Link>
                    <button type="button" disabled={toggling}
                      onClick={() => toggleMutation.mutate(job)} className={actionBtn}>
                      {job.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                      {job.is_active ? 'Close' : 'Reopen'}
                    </button>
                    <button type="button"
                      onClick={() => { deleteMutation.reset(); setDeleteTarget(job); }}
                      className={`${actionBtn} text-red-600 hover:bg-red-50 hover:text-red-700`}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-white border border-hairline rounded-2xl w-full max-w-sm p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-ink font-bold text-lg mb-2">Delete this job?</h3>
            <p className="text-ink/60 text-sm mb-1 break-words">"{deleteTarget.title}"</p>
            <p className="text-ink/60 text-sm mb-5">
              This permanently removes the job and its {deleteTarget.applicants_count} application
              {deleteTarget.applicants_count !== 1 ? 's' : ''}. This can't be undone. If you just want
              to stop new applications, use Close instead.
            </p>

            {deleteMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                ⚠️ Couldn't delete the job. Please try again.
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-hairline text-ink/70 text-sm font-medium
                           hover:bg-paper transition-colors">
                Cancel
              </button>
              <button type="button" disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50
                           text-white text-sm font-bold transition-colors">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;