export type InputSize = 'default' | 'compact';

/**
 * Class string for text inputs, selects and textareas.
 * `compact` matches <FormField size="compact"> (modals, long forms).
 * `extra` appends classes, e.g. 'pr-11' for a field with an icon button inside.
 */
export function inputClass(
  hasError = false,
  size: InputSize = 'default',
  extra = '',
): string {
  return [
    'w-full bg-paper border text-ink text-sm rounded-xl outline-none',
    'focus:border-evergreen transition-colors placeholder-ink/40',
    hasError ? 'border-red-400' : 'border-hairline',
    size === 'compact' ? 'px-3 py-2.5' : 'px-4 py-3',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}
