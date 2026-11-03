import { useId, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import FieldError from './FieldError';

/** Attributes to spread onto the control when it is not a direct child (see `children`). */
export interface FieldAttrs {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

interface FormFieldProps {
  label: ReactNode;
  /** The message, or a react-hook-form error object such as `errors.email` */
  error?: string | { message?: string };
  /** Help text under the field. Stays visible when there is an error. */
  hint?: ReactNode;
  /** 'default' matches the auth forms (text-sm); 'compact' the denser forms (text-xs). */
  size?: 'default' | 'compact';
  /** Wrapper classes, e.g. a grid column span */
  className?: string;
  /** Choose the id (otherwise the child's own id, or a generated one). */
  id?: string;
  /**
   * One <input>, <select> or <textarea>, which gets the attributes added for you.
   * When the control sits inside a wrapper (a show/hide button, an icon), pass a
   * function instead and spread the attributes onto the control yourself:
   * `{(a11y) => <div className="relative"><input {...a11y} /></div>}`
   */
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }> | ((attrs: FieldAttrs) => ReactNode);
}

const styles = {
  default: { label: 'text-sm font-medium text-ink mb-1.5 block', hint: 'text-xs text-ink/40 mt-1.5' },
  compact: { label: 'text-xs text-ink/60 mb-1 block', hint: 'text-xs text-ink/40 mt-1' },
};

/**
 * Label + control + hint + error, wired for assistive tech in one place:
 * the label points at the field, the field is marked invalid, and the hint and
 * error are attached with aria-describedby (so they are read with the field).
 */
const FormField = ({ label, error, hint, size = 'default', className, id, children }: FormFieldProps) => {
  const generatedId = useId();
  const child = typeof children === 'function' || !isValidElement(children) ? null : children;
  const fieldId = id ?? child?.props.id ?? generatedId;
  const message = typeof error === 'string' ? error : error?.message;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = message ? `${fieldId}-error` : undefined;
  const describedBy =
    [child?.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined;
  const attrs: FieldAttrs = { id: fieldId, 'aria-invalid': !!message, 'aria-describedby': describedBy };

  const field =
    typeof children === 'function'
      ? children(attrs)
      : child
        ? cloneElement(child, attrs as unknown as Record<string, unknown>)
        : children;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className={styles[size].label}>
        {label}
      </label>
      {field}
      {hint && (
        <p id={hintId} className={styles[size].hint}>
          {hint}
        </p>
      )}
      <FieldError id={fieldId} message={message} compact={size === 'compact'} />
    </div>
  );
};

export default FormField;
