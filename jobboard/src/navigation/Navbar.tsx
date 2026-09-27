import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, SquareUser, Briefcase, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useClickOutside } from '../hooks/useClickOutside';

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [signupMenuOpen, setSignupMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loginRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useClickOutside([loginRef], () => setLoginMenuOpen(false));
  useClickOutside([signupRef], () => setSignupMenuOpen(false));
  useClickOutside([userRef], () => setUserMenuOpen(false));

  const linkClasses =
    'w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline';

  const closeAll = () => {
    setLoginMenuOpen(false);
    setSignupMenuOpen(false);
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    closeAll();
    await logout();
    navigate('/');
  };

  const dashboardPath = user?.role === 'employer' ? '/employers/dashboard' : '/applicants/dashboard';

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-hairline sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={closeAll}>
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
              <Link to="/post"
                className="bg-evergreen hover:bg-evergreen-dark text-white text-sm
                           font-bold px-4 py-2 rounded-xl transition-colors">
                + Post a Job
              </Link>

              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Account menu"
                >
                  <span className="w-8 h-8 rounded-full bg-evergreen/10 text-evergreen font-bold
                                   text-sm flex items-center justify-center shrink-0">
                    {user.first_name?.charAt(0) || user.name?.charAt(0) || 'U'}
                  </span>
                  <span className="text-sm font-medium text-ink max-w-[120px] truncate">
                    {user.first_name || user.name}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-hairline">
                      <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                      <p className="text-xs text-ink/50 truncate">{user.email}</p>
                    </div>
                    <Link to={dashboardPath} onClick={closeAll} className={linkClasses}>
                      <UserIcon size={16} /> Dashboard
                    </Link>
                    <button onClick={handleLogout} className={`${linkClasses} text-red-600 hover:bg-red-50`}>
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/applicants"
                className="text-sm font-medium text-evergreen hover:text-evergreen-dark transition-colors">
                Post a Resume
              </Link>

              <div className="relative" ref={loginRef}>
                <button
                  onClick={() => { setLoginMenuOpen((o) => !o); setSignupMenuOpen(false); }}
                  className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 transition-colors rounded-lg"
                  aria-label="Login menu"
                >
                  Login
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                {loginMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link to="/applicants" onClick={closeAll} className={linkClasses}>
                      <SquareUser size={16} /> Applicant
                    </Link>
                    <Link to="/employers" onClick={closeAll} className={linkClasses}>
                      <Briefcase size={16} /> Employer
                    </Link>
                  </div>
                )}
              </div>

              <div className="relative" ref={signupRef}>
                <button
                  onClick={() => { setSignupMenuOpen((o) => !o); setLoginMenuOpen(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-evergreen text-evergreen
                             hover:bg-evergreen/5 rounded-lg text-sm font-medium transition-colors"
                  aria-label="Sign up menu"
                >
                  Sign Up
                  <ChevronDown size={16} />
                </button>
                {signupMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link to="/applicants/signup" onClick={closeAll} className={linkClasses}>
                      <SquareUser size={16} /> As Applicant
                    </Link>
                    <Link to="/employers/signup" onClick={closeAll} className={linkClasses}>
                      <Briefcase size={16} /> As Employer
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/' ? 'text-ink' : 'text-ink/50 hover:text-ink'
                }`}>
                Browse Jobs
              </Link>
              <Link to="/post"
                className="bg-evergreen hover:bg-evergreen-dark text-white text-sm
                           font-bold px-4 py-2 rounded-xl transition-colors">
                + Post a Job
              </Link>
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

      {/* Mobile panel */}
      {mobileOpen && (
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
              <Link to="/" onClick={closeAll}
                className={`block px-2 py-2.5 text-sm font-medium rounded-lg ${
                  pathname === '/' ? 'text-ink bg-gray-50' : 'text-ink/60 hover:bg-gray-50'
                }`}>
                Browse Jobs
              </Link>
              <Link to={dashboardPath} onClick={closeAll}
                className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
                <UserIcon size={16} /> Dashboard
              </Link>
              <Link to="/post" onClick={closeAll}
                className="block text-center bg-evergreen hover:bg-evergreen-dark text-white text-sm
                           font-bold px-4 py-2.5 rounded-xl transition-colors mt-2">
                + Post a Job
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-1">
                <LogOut size={16} /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={closeAll}
                className={`block px-2 py-2.5 text-sm font-medium rounded-lg ${
                  pathname === '/' ? 'text-ink bg-gray-50' : 'text-ink/60 hover:bg-gray-50'
                }`}>
                Browse Jobs
              </Link>
              <Link to="/applicants" onClick={closeAll}
                className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
                <SquareUser size={16} /> Applicant Login
              </Link>
              <Link to="/applicants/signup" onClick={closeAll}
                className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-evergreen hover:bg-gray-50 rounded-lg">
                <SquareUser size={16} /> Sign Up as Applicant
              </Link>
              <Link to="/employers" onClick={closeAll}
                className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
                <Briefcase size={16} /> Employer Login
              </Link>
              <Link to="/employers/signup" onClick={closeAll}
                className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-evergreen hover:bg-gray-50 rounded-lg">
                <Briefcase size={16} /> Sign Up as Employer
              </Link>
              <Link to="/post" onClick={closeAll}
                className="block text-center bg-evergreen hover:bg-evergreen-dark text-white text-sm
                           font-bold px-4 py-2.5 rounded-xl transition-colors mt-2">
                + Post a Job
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;