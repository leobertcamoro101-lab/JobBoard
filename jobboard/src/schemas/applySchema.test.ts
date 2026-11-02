import { describe, expect, it } from 'vitest';
import { applicantSchema, guestSchema } from './applySchema';

const coverLetter = 'x'.repeat(100);
const guest = { name: 'Alex', email: 'alex@example.test', cover_letter: coverLetter };

const messagesFor = (schema: typeof guestSchema | typeof applicantSchema, input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('guestSchema', () => {
  it('accepts the minimum valid application', () => {
    expect(guestSchema.safeParse(guest).success).toBe(true);
  });

  it('requires a name of at least two characters', () => {
    expect(messagesFor(guestSchema, { ...guest, name: 'A' })).toContain('name: Name is required');
    expect(messagesFor(guestSchema, { ...guest, name: '' })).toContain('name: Name is required');
  });

  it('requires a valid email', () => {
    expect(messagesFor(guestSchema, { ...guest, email: 'not-an-email' })).toContain('email: Valid email required');
  });

  it('requires a cover letter of at least 100 characters', () => {
    expect(messagesFor(guestSchema, { ...guest, cover_letter: 'x'.repeat(99) })).toContain(
      'cover_letter: Cover letter must be at least 100 characters',
    );
    expect(guestSchema.safeParse({ ...guest, cover_letter: 'x'.repeat(100) }).success).toBe(true);
  });

  it('treats LinkedIn and portfolio as optional URLs', () => {
    expect(guestSchema.safeParse({ ...guest, linkedin: '', portfolio: '' }).success).toBe(true);
    expect(guestSchema.safeParse({ ...guest, linkedin: 'https://linkedin.com/in/alex' }).success).toBe(true);
    expect(messagesFor(guestSchema, { ...guest, linkedin: 'linkedin.com/in/alex' })).toContain('linkedin: Must be a valid URL');
    expect(messagesFor(guestSchema, { ...guest, portfolio: 'nope' })).toContain('portfolio: Must be a valid URL');
  });
});

describe('applicantSchema', () => {
  it('does not need a name or email, because they come from the account', () => {
    expect(applicantSchema.safeParse({ cover_letter: coverLetter }).success).toBe(true);
  });

  it('still enforces the cover letter and URL rules', () => {
    expect(messagesFor(applicantSchema, { cover_letter: 'short' })).toContain(
      'cover_letter: Cover letter must be at least 100 characters',
    );
    expect(messagesFor(applicantSchema, { cover_letter: coverLetter, portfolio: 'nope' })).toContain(
      'portfolio: Must be a valid URL',
    );
  });
});
