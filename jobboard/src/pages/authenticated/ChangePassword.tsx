import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '../../api/client';
import Card from '../../components/Card';

const schema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    password: z
      .string()
      .min(10, 'Password must be at least ten (10) characters')
      .regex(/[a-z]/, 'Password must include a lowercase letter')
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[0-9]/, 'Password must include a number')
      .regex(/[^A-Za-z0-9]/, 'Password must include punctuation'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })
  .refine((d) => d.password !== d.current_password, {
    message: 'New password must be different from the current one',
    path: ['password'],
  });

type ChangePasswordForm = z.infer<typeof schema>;

const inputClass = (hasError?: boolean) =>
  `w-full bg-paper border ${hasError ? 'border-red-400' : 'border-hairline'}
   text-ink text-sm rounded-xl px-4 py-3 pr-11 outline-none focus:border-evergreen
   transition-colors placeholder-ink/40`;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-red-600 text-sm mt-1.5">
      <AlertCircle size={14} /> {message}
    </p>
  ) : null;

const ChangePasswordPage = () => {
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => reset(),
    onError: (err: any) => {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors?.current_password) {
        setError('current_password', { message: fieldErrors.current_password[0] });
      }
      if (fieldErrors?.password) {
        setError('password', { message: fieldErrors.password[0] });
      }
    },
  });

  const status = (mutation.error as any)?.response?.status;
  const showServerBanner = mutation.isError && status !== 422;

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
      aria-label={show ? 'Hide passwords' : 'Show passwords'}
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  const type = show ? 'text' : 'password';

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">Change password</h1>
      <p className="text-ink/60 mb-6">
        Other devices will be signed out when you change it.
      </p>

      <Card>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div>
            <label htmlFor='cp-current' className="text-sm font-medium text-ink mb-1.5 block">Current password</label>
            <div className="relative">
              <input id='cp-current' {...register('current_password')} type={type} autoComplete="current-password"
                className={inputClass(!!errors.current_password)} />
              {toggle}
            </div>
            <FieldError message={errors.current_password?.message} />
          </div>

          <div>
            <label htmlFor='cp-new' className="text-sm font-medium text-ink mb-1.5 block">New password</label>
            <input id='cp-new' {...register('password')} type={type} autoComplete="new-password"
              className={inputClass(!!errors.password)} />
            <p className="text-xs text-ink/40 mt-1.5">
              At least ten (10) characters, with uppercase and lowercase letters, a number and punctuation.
            </p>
            <FieldError message={errors.password?.message} />
          </div>

          <div>
            <label htmlFor='cp-confirm' className="text-sm font-medium text-ink mb-1.5 block">Confirm new password</label>
            <input id='cp-confirm' {...register('password_confirmation')} type={type} autoComplete="new-password"
              className={inputClass(!!errors.password_confirmation)} />
            <FieldError message={errors.password_confirmation?.message} />
          </div>

          {mutation.isSuccess && (
            <div className="flex items-center gap-2 bg-evergreen/10 border border-evergreen/20 text-evergreen
                            rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 size={16} /> Password updated.
            </div>
          )}

          {showServerBanner && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {(mutation.error as any)?.response?.data?.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                       text-white font-bold py-3 rounded-xl transition-colors">
            {mutation.isPending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;