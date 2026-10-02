import { type CSSProperties, type ReactNode } from 'react';

interface CardProps {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function Card({ className, style, children }: CardProps) {
  return (
    <div
      className={`relative bg-white border border-hairline rounded-2xl p-5 sm:p-6 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export default Card;
