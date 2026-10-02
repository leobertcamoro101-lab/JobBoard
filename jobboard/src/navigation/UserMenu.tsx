import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import type { User } from '../types';

interface Props {
  user: User;
  dashboardPath: string;
  onLogout: () => void;
}

const UserMenu = ({ user, dashboardPath, onLogout }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside([ref], () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
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
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
          <div className="px-4 py-2 border-b border-hairline">
            <p className="text-sm font-medium text-ink truncate">{user.name}</p>
            <p className="text-xs text-ink/50 truncate">{user.email}</p>
          </div>
          <Link to={dashboardPath} onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline">
            <UserIcon size={16} /> Dashboard
          </Link>
          <button onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;