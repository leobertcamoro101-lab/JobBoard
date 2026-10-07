import type { Job } from "../types";
import JobCard from "./JobCard";

interface JobListProps {
  jobs: Job[];
  error: unknown;
}

const JobList = ({ jobs, error }: JobListProps) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
        ⚠️ Failed to load jobs. Is the Laravel server running on port 8000?
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-ink/40">
        <p className="text-4xl mb-3">🔍</p>
        <p>No jobs found. Try different filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

export default JobList;
