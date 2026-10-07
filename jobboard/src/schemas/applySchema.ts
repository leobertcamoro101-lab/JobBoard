import { z } from 'zod';

const optionalUrl = z.string().url('Must be a valid URL').optional().or(z.literal(''));

const sharedFields = {
  phone: z.string().optional(),
  linkedin: optionalUrl,
  portfolio: optionalUrl,
  cover_letter: z.string().min(100, 'Cover letter must be at least 100 characters'),
};

export const guestSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  ...sharedFields,
});

// Logged-in applicants: name and email come from their account (the API enforces this too)
export const applicantSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  ...sharedFields,
});

export type ApplyForm = z.infer<typeof guestSchema>;