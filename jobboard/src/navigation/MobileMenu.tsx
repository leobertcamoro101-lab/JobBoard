import { Link } from 'react-router-dom';
import { Briefcase, LogOut, SquareUser, User as UserIcon } from 'lucide-react';
import type { User } from '../types';

interface Props {
  user: User | null;
  isAuthenticated: boolean;
  dashboardPath: string;
  canPostJob: boolean;
  pathname: string;
  onLogout: () => void;
  onClose: () => void;
}

const MobileMenu = ({ user, isAuthenticated, dashboardPath, canPostJob, pathname, onLogout, onClose }: Props) => {
  const postJob = (
    <Link to="/post" onClick={onClose}
      className="block text-center bg-evergreen hover:bg-evergreen-dark text-white text-sm
                 font-bold px-4 py-2.5 rounded-xl transition-colors mt-2">
      + Post a Job
    </Link>
  );

  return (
    <div className="sm:hidden border-t border-hairline bg-white px-4 py-3 space-y-1">
      {isAuthenticated && user ? (
        <>
          <div className="flex items-center gap-3 px-2 py-3 border-b border-hairline mb-1">
            <span className="w-9 h-9 rounded-full bg-evergreen/10 text-evergreen font-bold
                             text-sm flex items-center justify-center shrink-0">
              {user.first_name?.charAt(0) || user.name?.charAt(0) || 'U'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user.name}</p>
              <p className="text-xs text-ink/50 truncate">{user.email}</p>
            </div>
          </div>
          <Link to="/" onClick={onClose}
            className={`block px-2 py-2.5 text-sm font-medium rounded-lg ${
              pathname === '/' ? 'text-ink bg-gray-50' : 'text-ink/60 hover:bg-gray-50'
            }`}>
            Browse Jobs
          </Link>
          <Link to={dashboardPath} onClick={onClose}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
            <UserIcon size={16} /> Dashboard
          </Link>
          {canPostJob && postJob}
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-1">
            <LogOut size={16} /> Log Out
          </button>
        </>
      ) : (
        <>
          <Link to="/" onClick={onClose}
            className={`block px-2 py-2.5 text-sm font-medium rounded-lg ${
              pathname === '/' ? 'text-ink bg-gray-50' : 'text-ink/60 hover:bg-gray-50'
            }`}>
            Browse Jobs
          </Link>
          <Link to="/applicants" onClick={onClose}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
            <SquareUser size={16} /> Applicant Login
          </Link>
          <Link to="/applicants/signup" onClick={onClose}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-evergreen hover:bg-gray-50 rounded-lg">
            <SquareUser size={16} /> Sign Up as Applicant
          </Link>
          <Link to="/employers" onClick={onClose}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
            <Briefcase size={16} /> Employer Login
          </Link>
          <Link to="/employers/signup" onClick={onClose}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-evergreen hover:bg-gray-50 rounded-lg">
            <Briefcase size={16} /> Sign Up as Employer
          </Link>
          {canPostJob && postJob}
        </>
      )}
    </div>
  );
};

export default MobileMenu;