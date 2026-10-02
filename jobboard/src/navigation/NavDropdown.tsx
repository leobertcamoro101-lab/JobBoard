import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';

interface DropdownItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface Props {
  label: string;
  items: DropdownItem[];
  variant?: 'plain' | 'outline';
  onNavigate?: () => void;
}

const itemClasses =
  'w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline';

const NavDropdown = ({ label, items, variant = 'plain', onNavigate }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside([ref], () => setOpen(false));

  const triggerClasses =
    variant === 'outline'
      ? 'flex items-center gap-1 px-3 py-1.5 border border-evergreen text-evergreen ' +
        'hover:bg-evergreen/5 rounded-lg text-sm font-medium transition-colors'
      : 'flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 transition-colors rounded-lg';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className={triggerClasses} aria-label={`${label} menu`}>
        {label}
        <ChevronDown size={16} className={variant === 'outline' ? '' : 'text-gray-500'} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
          {items.map(({ label: itemLabel, to, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => { setOpen(false); onNavigate?.(); }} className={itemClasses}>
              <Icon size={16} /> {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavDropdown;