import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, SquareUser, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import NavDropdown from './NavDropdown';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';

const loginItems = [
  { label: 'Applicant', to: '/applicants', icon: SquareUser },
  { label: 'Employer', to: '/employers', icon: Briefcase },
];

const signupItems = [
  { label: 'As Applicant', to: '/applicants/signup', icon: SquareUser },
  { label: 'As Employer', to: '/employers/signup', icon: Briefcase },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'employer' ? '/employers/dashboard' : '/applicants/dashboard';
  const canPostJob = !isAuthenticated || user?.role === 'employer';

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-hairline sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="text-2xl">💼</span>
          <div>
            <h1 className="text-ink font-bold text-lg leading-none">JobBoard</h1>
            <p className="text-evergreen font-mono text-xs">React + Laravel</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link to="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/' ? 'text-ink' : 'text-ink/50 hover:text-ink'
                }`}>
                Browse Jobs
              </Link>
              {canPostJob && (
                <Link to="/post"
                  className="bg-evergreen hover:bg-evergreen-dark text-white text-sm
                             font-bold px-4 py-2 rounded-xl transition-colors">
                  + Post a Job
                </Link>
              )}
              <UserMenu user={user} dashboardPath={dashboardPath} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link to="/applicants"
                className="text-sm font-medium text-evergreen hover:text-evergreen-dark transition-colors">
                Post a Resume
              </Link>
              <NavDropdown label="Login" items={loginItems} />
              <NavDropdown label="Sign Up" items={signupItems} variant="outline" />
              <Link to="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/' ? 'text-ink' : 'text-ink/50 hover:text-ink'
                }`}>
                Browse Jobs
              </Link>
              {canPostJob && (
                <Link to="/post"
                  className="bg-evergreen hover:bg-evergreen-dark text-white text-sm
                             font-bold px-4 py-2 rounded-xl transition-colors">
                  + Post a Job
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="sm:hidden p-2 -mr-2 text-ink hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <MobileMenu
          user={user}
          isAuthenticated={isAuthenticated}
          dashboardPath={dashboardPath}
          canPostJob={canPostJob}
          pathname={pathname}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;