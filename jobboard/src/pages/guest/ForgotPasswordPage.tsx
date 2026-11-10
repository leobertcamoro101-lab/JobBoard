import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import FormField from "../../components/FormField";
import { inputClass } from "../../utils/inputClass";
import { forgotPassword } from "../../api/client";
import { getErrorMessage } from "../../utils/apiError";

const schema = z.object({
  email: z
    .string()
    .min(1, "The Email field is required")
    .email("Enter a valid email"),
});

type ForgotForm = z.infer<typeof schema>;

const ForgotPasswordPage = () => {
  const { pathname } = useLocation();
  // The same page serves both logins; only the way back differs
  const loginPath = pathname.startsWith("/employers") ? "/employers" : "/applicants";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({ mutationFn: forgotPassword });

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-ink mb-2">Forgot your password?</h1>
      <p className="text-ink/60 mb-8">
        Enter the email you signed up with and we'll send you a link to choose a
        new one.
      </p>

      {mutation.isSuccess ? (
        <div className="space-y-5">
          <div
            role="status"
            className="flex items-start gap-2 bg-evergreen/10 border border-evergreen/20 text-evergreen
                       rounded-xl px-4 py-3 text-sm"
          >
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>
              If that email has an account, we've sent a link to reset the
              password. It works once and expires in 60 minutes. Check your spam
              folder if it doesn't arrive.
            </span>
          </div>
          <Link
            to={loginPath}
            className="text-sm font-medium text-evergreen hover:text-evergreen-dark"
          >
            ← Back to login
          </Link>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit((d) => mutation.mutate(d.email))}
          className="space-y-5"
        >
          <FormField label="Email" error={errors.email}>
            <input
              id="forgot-email"
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="email@example.com"
              className={inputClass(!!errors.email)}
            />
          </FormField>

          {mutation.isError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {getErrorMessage(mutation.error, "Something went wrong. Please try again.")}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                       text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {mutation.isPending ? "Sending..." : "Send reset link"}
          </button>

          <p className="text-center text-sm text-ink/60">
            <Link
              to={loginPath}
              className="font-medium text-evergreen hover:text-evergreen-dark"
            >
              Back to login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
