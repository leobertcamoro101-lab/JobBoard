import type { Location } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { User } from '../types';
// import { getPostLoginTarget } from './authRedirect';

const user = (role: User['role']): User => ({
  id: 1,
  role,
  first_name: 'Alex',
  last_name: 'Tan',
  name: 'Alex Tan',
  email: 'alex@example.test',
  mobile_number: '09171234567',
  email_verified_at: null,
  created_at: '',
  updated_at: '',
});

const from = (pathname: string, search = '', hash = ''): Location =>
  ({ pathname, search, hash, state: null, key: 'k' }) as Location;

describe('getPostLoginTarget', () => {
  describe('with nowhere to return to', () => {
    it('sends an applicant home and an employer to their dashboard', () => {
      expect(getPostLoginTarget(user('applicant'))).toBe('/');
      expect(getPostLoginTarget(user('employer'))).toBe('/employers/dashboard');
    });

    it('treats null and an empty pathname the same as no location', () => {
      expect(getPostLoginTarget(user('applicant'), null)).toBe('/');
      expect(getPostLoginTarget(user('employer'), from(''))).toBe('/employers/dashboard');
    });
  });

  describe('returning to the page they first tried to open', () => {
    it('returns an applicant to a job page, keeping query string and hash', () => {
      expect(getPostLoginTarget(user('applicant'), from('/jobs/12', '?ref=email', '#apply'))).toBe(
        '/jobs/12?ref=email#apply',
      );
    });

    it('returns an applicant to their own dashboard', () => {
      expect(getPostLoginTarget(user('applicant'), from('/applicants/dashboard'))).toBe('/applicants/dashboard');
    });

    it('returns an employer to /post and to their dashboard', () => {
      expect(getPostLoginTarget(user('employer'), from('/post'))).toBe('/post');
      expect(getPostLoginTarget(user('employer'), from('/employers/dashboard'))).toBe('/employers/dashboard');
    });
  });

  describe('pages their role may not open', () => {
    it('keeps an applicant out of /post and the employer dashboard, including sub-paths', () => {
      for (const path of ['/post', '/post/5', '/employers/dashboard', '/employers/dashboard/jobs/3']) {
        expect(getPostLoginTarget(user('applicant'), from(path, '?x=1'))).toBe('/');
      }
    });

    it('keeps an employer out of the applicant dashboard, including sub-paths', () => {
      for (const path of ['/applicants/dashboard', '/applicants/dashboard/applications']) {
        expect(getPostLoginTarget(user('employer'), from(path))).toBe('/employers/dashboard');
      }
    });

    it('does not block look-alike paths that only share a prefix', () => {
      expect(getPostLoginTarget(user('applicant'), from('/posting-tips'))).toBe('/posting-tips');
      expect(getPostLoginTarget(user('applicant'), from('/post-office'))).toBe('/post-office');
      expect(getPostLoginTarget(user('employer'), from('/applicants/dashboards'))).toBe('/applicants/dashboards');
    });
  });
});
