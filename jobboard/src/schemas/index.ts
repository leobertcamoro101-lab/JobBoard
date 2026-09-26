import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'The Email field is required').email('Enter a valid email'),
  password: z.string().min(1, 'The Password field is required'),
  remember: z.boolean().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;