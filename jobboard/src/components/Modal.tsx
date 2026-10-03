import { type ReactNode } from 'react';
import Card from './Card';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-sm' — default below covers most cases
  cardClassName?: string;
}

const Modal = ({ onClose, children, maxWidth = 'max-w-lg', cardClassName = '' }: ModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-0 sm:p-0 shadow-xl ${cardClassName}`}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {children}
      </Card>
    </div>
  );
};

export default Modal;