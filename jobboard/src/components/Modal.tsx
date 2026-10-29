import { type ReactNode, useEffect, useRef } from 'react';
import Card from './Card';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** id of the heading that names the dialog */
  labelledBy?: string;
  maxWidth?: string;
  cardClassName?: string;
}

const Modal = ({ onClose, children, labelledBy, maxWidth = 'max-w-lg', cardClassName = '' }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Move focus into the dialog, and give it back to whatever opened it
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-0 sm:p-0 shadow-xl outline-none ${cardClassName}`}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {children}
      </Card>
    </div>
  );
};

export default Modal;