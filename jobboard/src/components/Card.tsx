import { type CSSProperties, type ElementType, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  [key: string]: unknown; // pass through to/onClick/etc. when `as` is Link or button
}

function Card({ as: Component = 'div', className, style, children, ...rest }: CardProps) {
  return (
    <Component
      className={twMerge('relative bg-white border border-hairline rounded-2xl p-5 sm:p-6', className)}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Card;