import type { ChangeEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

interface FilePickerProps {
  /** Allowed extensions, with the dot: [".pdf", ".docx"] */
  accept: string[];
  maxBytes: number;
  /** The button text, which is also the file input's accessible name */
  label: string;
  icon: LucideIcon;
  /**
   * Called with the file when it passes both checks, otherwise with null and the
   * message to show. Show it with <FieldError alert message={...} /> so it is announced.
   */
  onPick: (file: File | null, error: string) => void;
  /** Override the wrong-type message */
  typeMessage?: string;
}

/**
 * A styled "choose file" button. The real <input type="file"> stays in the page
 * (visually hidden), so it can be tabbed to and the ring shows on the button.
 * It checks the extension and size, so each page doesn't repeat that.
 */
const FilePicker = ({ accept, maxBytes, label, icon: Icon, onPick, typeMessage }: FilePickerProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    const ext = '.' + picked.name.split('.').pop()?.toLowerCase();
    if (!accept.includes(ext)) {
      onPick(null, typeMessage ?? `Only ${accept.join(', ')} files are allowed`);
    } else if (picked.size > maxBytes) {
      onPick(null, `File must be less than ${Math.round(maxBytes / 1024)}kb`);
    } else {
      onPick(picked, '');
    }
    // Lets the same file be chosen again after it was rejected or cleared
    e.target.value = '';
  };

  return (
    <label
      className="cursor-pointer inline-flex items-center justify-center gap-2
                 border border-evergreen text-evergreen hover:bg-evergreen/5
                 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0
                 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-evergreen has-[:focus-visible]:ring-offset-2"
    >
      <Icon size={16} /> {label}
      <input type="file" accept={accept.join(',')} onChange={handleChange} className="sr-only" />
    </label>
  );
};

export default FilePicker;
