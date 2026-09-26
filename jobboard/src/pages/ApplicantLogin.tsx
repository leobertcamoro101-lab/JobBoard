import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().min(1, 'The Email field is required').email('Enter a valid email'),
  password: z.string().min(1, 'The Password field is required'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const inputClass = (hasError?: boolean) =>
  `w-full bg-paper border ${hasError ? 'border-red-400' : 'border-hairline'}
   text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
   transition-colors placeholder-ink/40`;

const ApplicantLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    setIsPending(true);
    try {
      const user = await login(data);
      navigate(user.role === 'employer' ? '/employers/dashboard' : '/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-ink mb-8">Applicants Login</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
          <input {...register('email')} type="email" placeholder="email@example.com"
            className={inputClass(!!errors.email)} />
          {errors.email && (
            <p className="flex items-center gap-1.5 text-red-600 text-sm mt-1.5">
              <AlertCircle size={14} /> {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-ink mb-1.5 block">Password</label>
          <div className="relative">
            <input {...register('password')} type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className={`${inputClass(!!errors.password)} pr-11`} />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1.5 text-red-600 text-sm mt-1.5">
              <AlertCircle size={14} /> {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input {...register('remember')} type="checkbox"
              className="w-4 h-4 rounded border-hairline text-evergreen focus:ring-evergreen accent-evergreen" />
            Keep Me Logged In
          </label>
          <Link to="/applicants/forgot-password" className="text-sm font-medium text-evergreen hover:text-evergreen-dark">
            Forgot Password
          </Link>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            ⚠️ {serverError}
          </div>
        )}

        <button type="submit" disabled={isPending}
          className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                     text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          {isPending ? 'Logging in...' : <>Log In →</>}
        </button>

        <p className="text-center text-sm text-ink/60">
          Don't have an account?{' '}
          <Link to="/applicants/signup" className="font-medium text-evergreen hover:text-evergreen-dark">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ApplicantLogin;