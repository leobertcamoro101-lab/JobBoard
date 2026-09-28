import type { Location } from 'react-router-dom';
import type { User } from '../types';

const EMPLOYER_ONLY = ['/post', '/employers/dashboard'];
const APPLICANT_ONLY = ['/applicants/dashboard'];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(p + '/'));

/**
 * Where to go after a successful login.
 * Returns the page the user originally tried to open (set by ProtectedRoute
 * in location.state.from) unless their role isn't allowed there.
 */
export const getPostLoginTarget = (user: User, from?: Location | null): string => {
  const fallback = user.role === 'employer' ? '/employers/dashboard' : '/';

  if (!from?.pathname) return fallback;

  const blocked = user.role === 'employer' ? APPLICANT_ONLY : EMPLOYER_ONLY;
  if (matches(from.pathname, blocked)) return fallback;

  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
};