import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs } from '../api/client';
import type { JobFilters } from '../types';
import JobCard from '../components/JobCard';
import SearchFilters from '../components/SearchFilters';

const HomePage = () => {
  const [filters, setFilters] = useState<JobFilters>({});

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobs(filters),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
          Find Your Next <span className="text-violet-400">Dream Job</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Browse hundreds of opportunities from top companies across the Philippines and beyond.
        </p>
      </div>

      <SearchFilters onFilter={setFilters} total={jobs.length} />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl h-52" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4">
          ⚠️ Failed to load jobs. Is the Laravel server running on port 8000?
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p>No jobs found. Try different filters.</p>
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
};

export default HomePage;
