import { useState } from 'react';
import type { JobFilters } from '../types';

const TYPES = ['full-time', 'part-time', 'remote', 'contract'];
const CATEGORIES = ['Engineering', 'Design', 'DevOps', 'Marketing', 'Sales', 'Product'];

interface Props {
  onFilter: (filters: JobFilters) => void;
  total: number;
}

const SearchFilters = ({ onFilter, total }: Props) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ search, type, category });
  };

  const handleReset = () => {
    setSearch(''); setType(''); setCategory('');
    onFilter({});
  };

  const hasFilters = search || type || category;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6">
      <form onSubmit={handleSearch}>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs or companies..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm
                       rounded-xl px-4 py-2.5 outline-none focus:border-violet-400
                       transition-colors placeholder-gray-500"
          />
          <button type="submit"
            className="bg-violet-500 hover:bg-violet-400 text-white font-bold
                       px-5 py-2.5 rounded-xl transition-colors shrink-0">
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={type} onChange={e => { setType(e.target.value); onFilter({ search, type: e.target.value, category }); }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs
                       rounded-xl px-3 py-2 outline-none focus:border-violet-400 transition-colors">
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>

          <select value={category} onChange={e => { setCategory(e.target.value); onFilter({ search, type, category: e.target.value }); }}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs
                       rounded-xl px-3 py-2 outline-none focus:border-violet-400 transition-colors">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {hasFilters && (
            <button type="button" onClick={handleReset}
              className="text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-xl
                         border border-red-500/30 hover:bg-red-500/10 transition-colors">
              Reset ✕
            </button>
          )}

          <span className="ml-auto text-gray-500 text-xs self-center">
            {total} job{total !== 1 ? 's' : ''} found
          </span>
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;
