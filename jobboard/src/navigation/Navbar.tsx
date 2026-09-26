import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, SquareUser, Briefcase, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClasses =
    'w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline';

  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

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
          <Link to="/applicants"
            className="text-sm font-medium text-evergreen hover:text-evergreen-dark transition-colors">
            Post a Resume
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 transition-colors rounded-lg"
              aria-label="Auth menu"
            >
              Login
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            {menuOpen && (
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
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="sm:hidden p-2 -mr-2 text-ink hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-hairline bg-white px-4 py-3 space-y-1">
          <Link to="/" onClick={closeAll}
            className={`block px-2 py-2.5 text-sm font-medium rounded-lg ${
              pathname === '/' ? 'text-ink bg-gray-50' : 'text-ink/60 hover:bg-gray-50'
            }`}>
            Browse Jobs
          </Link>
          <Link to="/applicants" onClick={closeAll}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
            <SquareUser size={16} /> Applicant Login / Post a Resume
          </Link>
          <Link to="/employers" onClick={closeAll}
            className="flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-ink/60 hover:bg-gray-50 rounded-lg">
            <Briefcase size={16} /> Employer Login
          </Link>
          <Link to="/post" onClick={closeAll}
            className="block text-center bg-evergreen hover:bg-evergreen-dark text-white text-sm
                       font-bold px-4 py-2.5 rounded-xl transition-colors mt-2">
            + Post a Job
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;