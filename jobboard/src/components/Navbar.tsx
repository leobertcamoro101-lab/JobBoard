import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">💼</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">JobBoard</h1>
            <p className="text-violet-400 font-mono text-xs">React + Laravel</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}>
            Browse Jobs
          </Link>
          <Link to="/post"
            className="bg-violet-500 hover:bg-violet-400 text-white text-sm
                       font-bold px-4 py-2 rounded-xl transition-colors">
            + Post a Job
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
