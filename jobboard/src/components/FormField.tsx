import { useId, cloneElement, isValidElement, type ReactElement } from 'react';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  hint?: string;
  // Every call site passes a single <input>/<select> as children.
  children: ReactElement<{ id?: string }>;
}

const FormField = ({ label, error, hint, children }: FormFieldProps) => {
  // A <label> with no `for` (and a field with no `id`) reads as unlabeled to
  // assistive tech even though it's visually right above the field — Chrome
  // DevTools' accessibility panel flags this as "No label associated with a
  // form field". Generating the id here means every page using FormField
  // gets a correctly wired label without threading an id prop through each
  // one individually.
  const generatedId = useId();
  const fieldId = children.props.id ?? generatedId;
  const field = isValidElement(children) ? cloneElement(children, { id: fieldId }) : children;

  return (
    <div>
      <label htmlFor={fieldId} className="text-xs text-[#857A64] mb-1 block font-medium">{label}</label>
      {field}
      {hint && !error && <p className="text-[#A89873] text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-600 text-xs mt-1">⚠️ {error.message}</p>}
    </div>
  );
};

export default FormField;
