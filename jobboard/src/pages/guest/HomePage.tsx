import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobs } from '../../api/client';
import type { JobFilters } from '../../types';
import SearchFilters from '../../components/SearchFilters';
import JobList from '../../components/JobList';
import LoadingSpinner from '../../components/LoadingSpinner';

const HomePage = () => {
  const [filters, setFilters] = useState<JobFilters>({});

  const { data: jobs = [], isLoading, isFetching, error } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobs(filters),
  });

  const isRefetching = isFetching && !isLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-ink mb-3">
          Find Your Next <span className="text-evergreen">Dream Job</span>
        </h1>
        <p className="text-ink/60 text-lg max-w-xl mx-auto">
          Browse hundreds of opportunities from top companies across the Philippines and beyond.
        </p>
      </div>

      <SearchFilters onFilter={setFilters} total={jobs.length} />

      {/* Thin bar instead of a full spinner swap — only shows while filters are being applied */}
      {isRefetching && (
        <div className="h-0.5 w-full bg-evergreen/40 rounded-full mb-4 -mt-2 animate-pulse" />
      )}

      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner />
        </div>
      ) : (
        <div className={isRefetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <JobList jobs={jobs} error={error} />
        </div>
      )}
    </div>
  );
};

export default HomePage;