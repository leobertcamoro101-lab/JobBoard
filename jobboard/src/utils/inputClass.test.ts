import { describe, it, expect } from 'vitest';
import { inputClass } from './inputClass';

const tokens = (s: string) => s.split(' ');

describe('inputClass', () => {
  it('uses the hairline border and roomy padding by default', () => {
    const t = tokens(inputClass());
    expect(t).toContain('border-hairline');
    expect(t).not.toContain('border-red-400');
    expect(t).toContain('px-4');
    expect(t).toContain('py-3');
  });

  it('switches to the red border when there is an error', () => {
    const t = tokens(inputClass(true));
    expect(t).toContain('border-red-400');
    expect(t).not.toContain('border-hairline');
  });

  it('uses tighter padding for the compact size', () => {
    const t = tokens(inputClass(false, 'compact'));
    expect(t).toContain('px-3');
    expect(t).toContain('py-2.5');
    expect(t).not.toContain('px-4');
    expect(t).not.toContain('py-3');
  });

  it('appends extra classes, such as space for an icon button', () => {
    expect(tokens(inputClass(false, 'default', 'pr-11'))).toContain('pr-11');
  });

  it('always carries the shared base styles', () => {
    for (const s of [inputClass(), inputClass(true, 'compact', 'pr-11')]) {
      const t = tokens(s);
      for (const c of ['w-full', 'bg-paper', 'rounded-xl', 'focus:border-evergreen', 'text-sm']) {
        expect(t).toContain(c);
      }
    }
  });

  it('produces a clean single-spaced string with no stray whitespace', () => {
    for (const s of [inputClass(), inputClass(true, 'compact'), inputClass(false, 'default', 'pr-11')]) {
      expect(s).toBe(s.trim());
      expect(s).not.toMatch(/\s{2,}|\n/);
    }
  });
});
