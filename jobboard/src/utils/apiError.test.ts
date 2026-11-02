import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './apiError';

describe('getErrorMessage', () => {
  it('uses the server message when there is one', () => {
    const err = { response: { status: 422, data: { message: 'The email has already been taken.' } } };
    expect(getErrorMessage(err, 'Something went wrong')).toBe('The email has already been taken.');
  });

  it('asks the user to wait on 429, whatever the server said', () => {
    const err = { response: { status: 429, data: { message: 'Too Many Attempts.' } } };
    expect(getErrorMessage(err, 'Something went wrong')).toBe(
      'Too many attempts. Please wait a minute and try again.',
    );
  });

  it('falls back when the response has no message', () => {
    expect(getErrorMessage({ response: { status: 500, data: {} } }, 'Something went wrong')).toBe('Something went wrong');
    expect(getErrorMessage({ response: { status: 500, data: { message: '' } } }, 'Something went wrong')).toBe(
      'Something went wrong',
    );
  });

  it('falls back for network errors and non-axios values', () => {
    expect(getErrorMessage(new Error('Network Error'), 'Could not reach the server')).toBe('Could not reach the server');
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage('boom', 'fallback')).toBe('fallback');
  });
});
