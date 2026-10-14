import { useEffect, useState, type CSSProperties } from 'react';

interface AvatarProps {
  className?: string;
  style?: CSSProperties;
  image?: string | null;
  name?: string | null;
  alt?: string;
  /** Size as a CSS length, e.g. "48px". Omit for the responsive default. */
  width?: string;
  /** 'circle' for people, 'square' (rounded) for company logos. */
  shape?: 'circle' | 'square';
  /** Render the circle/box on its own, without the centering wrapper. */
  inline?: boolean;
}

// const getInitials = (name?: string | null): string => {
//   if (!name) return '?';
//   const parts = name.trim().split(' ').filter(Boolean);
//   if (parts.length === 0) return '?';
//   if (parts.length === 1) return parts[0][0].toUpperCase();
//   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// };

const getInitials = (name?: string | null, shape: 'circle' | 'square' = 'circle'): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';

  // Company marks (square): first two letters of the name, e.g. "Apex Technology Group" -> "AP"
  if (shape === 'square') return parts.join('').slice(0, 2).toUpperCase();

  // People (circle): first and last initial
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function Avatar({
  className,
  style,
  image,
  name,
  alt,
  width,
  shape = 'circle',
  inline = false,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);

  // A new image URL gets a fresh chance to load
  useEffect(() => setFailed(false), [image]);

  const px = width ? parseInt(width, 10) : NaN;
  const sizeClasses = width ? '' : 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24';
  const sizeStyle: CSSProperties | undefined = width ? { width, height: width } : undefined;
  const radius = shape === 'square' ? 'rounded-xl' : 'rounded-full';
  const showImage = !!image && !failed;

  const fontSize = Number.isNaN(px) ? undefined : Math.max(11, Math.round(px * 0.38));
  const textClass = Number.isNaN(px) ? 'text-2xl' : '';

  const content = showImage ? (
    <img
      src={image!}
      alt={alt ?? name ?? ''}
      onError={() => setFailed(true)}
      className={`block border border-hairline bg-white ${radius} ${sizeClasses} ${
        shape === 'square' ? 'object-contain p-1' : 'object-cover'
      }`}
      style={sizeStyle}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-evergreen/10 border border-evergreen/20 ${radius} ${sizeClasses}`}
      style={sizeStyle}
      role="img"
      aria-label={alt ?? name ?? undefined}
    >
      <span className={`font-bold text-evergreen ${textClass}`} style={{ fontSize }}>
        {getInitials(name, shape)}
      </span>
    </div>
  );

  if (inline) {
    // className/style go on the element that is actually the avatar
    return (
      <div className={`shrink-0 ${className ?? ''}`} style={{ ...sizeStyle, ...style }}>
        {content}
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center w-full h-full ${className ?? ''}`} style={style}>
      {content}
    </div>
  );
}

export default Avatar;