import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
  /** Same id as the input; the message gets `${id}-error` */
  id?: string;
  compact?: boolean;
}

export const fieldA11y = (id: string, message?: string) => ({
  'aria-invalid': !!message,
  'aria-describedby': message ? `${id}-error` : undefined,
});

const FieldError = ({ message, id, compact = false }: FieldErrorProps) =>
  message ? (
    <p
      id={id ? `${id}-error` : undefined}
      className={
        compact
          ? 'text-red-600 text-xs mt-1'
          : 'flex items-center gap-1.5 text-red-600 text-sm mt-1.5'
      }
    >
      {!compact && <AlertCircle size={14} aria-hidden="true" />} {message}
    </p>
  ) : null;

export default FieldError;