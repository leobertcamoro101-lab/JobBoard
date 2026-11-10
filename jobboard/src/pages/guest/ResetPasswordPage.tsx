import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import FormField from "../../components/FormField";
import { inputClass } from "../../utils/inputClass";
import { resetPassword } from "../../api/client";
import { getErrorMessage } from "../../utils/apiError";

const schema = z
  .object({
    password: z
      .string()
      .min(10, "Password must be at least ten (10) characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include punctuation"),
    password_confirmation: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type ResetForm = z.infer<typeof schema>;

const REQUEST_NEW_LINK = "/applicants/forgot-password";

const RequestNewLink = () => (
  <Link
    to={REQUEST_NEW_LINK}
    className="font-medium text-evergreen hover:text-evergreen-dark"
  >
    Request a new link
  </Link>
);

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onError: (err: any) => {
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors?.password) {
        setError("password", { message: fieldErrors.password[0] });
      }
    },
  });

  if (!token || !email) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-ink mb-4">Reset your password</h1>
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠️ This reset link is incomplete. Open the link from your email again,
          or request a new one.
        </div>
        <p className="mt-5 text-sm">
          <RequestNewLink />
        </p>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-ink mb-4">Password reset</h1>
        <div
          role="status"
          className="flex items-center gap-2 bg-evergreen/10 border border-evergreen/20 text-evergreen
                     rounded-xl px-4 py-3 text-sm"
        >
          <CheckCircle2 size={16} /> Your password has been reset. Other devices
          were signed out.
        </div>
        <p className="mt-5 text-sm text-ink/60">
          Log in as an{" "}
          <Link to="/applicants" className="font-medium text-evergreen hover:text-evergreen-dark">
            applicant
          </Link>{" "}
          or an{" "}
          <Link to="/employers" className="font-medium text-evergreen hover:text-evergreen-dark">
            employer
          </Link>
          .
        </p>
      </div>
    );
  }

  const status = (mutation.error as any)?.response?.status;
  const linkProblem = (mutation.error as any)?.response?.data?.errors?.email?.[0];
  const showBanner = mutation.isError && (linkProblem || status !== 422);
  const type = show ? "text" : "password";

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-ink mb-2">Reset your password</h1>
      <p className="text-ink/60 mb-8">
        Choose a new password for <span className="font-medium text-ink break-all">{email}</span>.
      </p>

      <form
        noValidate
        onSubmit={handleSubmit((d) =>
          mutation.mutate({ token, email, password: d.password, password_confirmation: d.password_confirmation }),
        )}
        className="space-y-5"
      >
        <FormField
          label="New password"
          id="reset-password"
          error={errors.password}
          hint="At least ten (10) characters, with uppercase and lowercase letters, a number and punctuation."
        >
          {(a11y) => (
            <div className="relative">
              <input
                {...a11y}
                {...register("password")}
                type={type}
                autoComplete="new-password"
                className={inputClass(!!errors.password, "default", "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
                aria-label={show ? "Hide passwords" : "Show passwords"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
        </FormField>

        <FormField label="Confirm new password" error={errors.password_confirmation}>
          <input
            id="reset-confirm"
            {...register("password_confirmation")}
            type={type}
            autoComplete="new-password"
            className={inputClass(!!errors.password_confirmation)}
          />
        </FormField>

        {showBanner && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            ⚠️ {linkProblem || getErrorMessage(mutation.error, "Something went wrong. Please try again.")}
            {linkProblem && (
              <>
                {" "}
                <RequestNewLink />
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                     text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          {mutation.isPending ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
