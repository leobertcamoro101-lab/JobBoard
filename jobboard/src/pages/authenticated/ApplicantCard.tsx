import { ExternalLink, FileText, Mail, Phone } from 'lucide-react';
import type { ApplicationStatus, EmployerApplication } from '../../types';
import CoverLetter from './CoverLetter';
import Card from '../../components/Card';
const STATUS_OPTIONS: ApplicationStatus[] = ['pending', 'reviewed', 'accepted', 'rejected'];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-evergreen/10 text-evergreen border-evergreen/20',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

interface CardProps {
  app: EmployerApplication;
  busy: boolean;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
}

const ApplicantCard = ({ app, busy, onStatusChange }: CardProps) => {
  const applied = new Date(app.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const linkClass = 'inline-flex items-center gap-1 text-evergreen hover:text-evergreen-dark text-sm font-medium';

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-ink font-bold break-words">{app.name}</h3>
          <p className="text-ink/40 text-xs">Applied {applied}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_STYLES[app.status]}`}>
            {app.status}
          </span>
          <select value={app.status} disabled={busy}
            onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
            aria-label={`Change status for ${app.name}`}
            className="bg-paper border border-hairline text-ink text-xs rounded-xl px-3 py-2
                       outline-none focus:border-evergreen transition-colors disabled:opacity-50">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
        <a href={`mailto:${app.email}`} className={`${linkClass} break-all`}>
          <Mail size={14} /> {app.email}
        </a>
        {app.phone && (
          <a href={`tel:${app.phone}`} className={linkClass}>
            <Phone size={14} /> {app.phone}
          </a>
        )}
        {app.linkedin && (
          <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <ExternalLink size={14} /> LinkedIn
          </a>
        )}
        {app.portfolio && (
          <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <ExternalLink size={14} /> Portfolio
          </a>
        )}
        {app.resume_url && (
          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <FileText size={14} /> Resume
          </a>
        )}
      </div>

      <CoverLetter text={app.cover_letter} />
    </Card>
  );
};

export default ApplicantCard;