import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import FieldError, { fieldA11y } from '../../components/FieldError';
import { useAuthStore } from "../../stores/authStore";
import { getPostLoginTarget } from "../../utils/authRedirect";
import { getErrorMessage } from "../../utils/apiError";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "The Email field is required")
    .email("Enter a valid email"),
  password: z.string().min(1, "The Password field is required"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const inputClass = (hasError?: boolean) =>
  `w-full bg-paper border ${hasError ? "border-red-400" : "border-hairline"}
   text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
   transition-colors placeholder-ink/40`;

const EmployerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    setIsPending(true);
    try {
      const user = await login(data);
      navigate(getPostLoginTarget(user, from), { replace: true });
    } catch (err: any) {
      setServerError(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-ink mb-8">Employers Login</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-ink mb-1.5 block"
          >
            Email
          </label>
          <input
            id="login-email"
            {...register("email")}
            {...fieldA11y('login-email', errors.email?.message)}
            type="email"
            placeholder="email@example.com"
            className={inputClass(!!errors.email)}
          />
          {errors.email && (
            <FieldError id="login-email" message={errors.email?.message} />
          )}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-ink mb-1.5 block"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              {...register("password")}
              {...fieldA11y('login-password', errors.password?.message)}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`${inputClass(!!errors.password)} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <FieldError id="login-password" message={errors.password?.message} />
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              {...register("remember")}
              type="checkbox"
              className="w-4 h-4 rounded border-hairline text-evergreen focus:ring-evergreen accent-evergreen"
            />
            Keep Me Logged In
          </label>
          <Link
            to="/employers/forgot-password"
            className="text-sm font-medium text-evergreen hover:text-evergreen-dark"
          >
            Forgot Password
          </Link>
        </div>

        {serverError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            ⚠️ {serverError}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Link
            to="/post"
            className="text-sm font-medium text-evergreen hover:text-evergreen-dark"
          >
            Post a Job Instead
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                       text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            {isPending ? "Logging in..." : <>Log In →</>}
          </button>
        </div>

        <p className="text-center text-sm text-ink/60">
          Don't have an account?{" "}
          <Link
            to="/employers/signup"
            className="font-medium text-evergreen hover:text-evergreen-dark"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default EmployerLogin;
