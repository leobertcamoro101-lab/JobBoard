import { useEffect, type RefObject } from 'react';

export function useClickOutside(refs: RefObject<HTMLElement>[], onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const clickedInside = refs.some((ref) => ref.current?.contains(e.target as Node));
      if (!clickedInside) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [refs, onOutside]);
}