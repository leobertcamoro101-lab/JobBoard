import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Image as ImageIcon } from "lucide-react";
import FieldError from '../../components/FieldError';
import FormField from '../../components/FormField';
import FilePicker from '../../components/FilePicker';
import { useAuthStore } from "../../stores/authStore";
import { getErrorMessage } from "../../utils/apiError";

const MAX_LOGO_BYTES = 900 * 1024; // 900kb
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const step1Schema = z
  .object({
    email: z
      .string()
      .min(1, "Email Address is required")
      .email("Enter a valid email"),
    password: z
      .string()
      .min(10, "Password must be at least ten (10) characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .regex(/[^A-Za-z0-9]/, "Password must include punctuation"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    mobileNumber: z.string().min(1, "Mobile Number is required"),
    companyName: z.string().min(1, "Company Name is required"),
    companyWebsite: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Step1Form = z.infer<typeof step1Schema>;

const inputClass = (hasError?: boolean) =>
  `w-full bg-paper border ${hasError ? "border-red-400" : "border-hairline"}
   text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
   transition-colors placeholder-ink/40`;

const EmployerSignup = () => {
  const navigate = useNavigate();
  const registerEmployer = useAuthStore((s) => s.registerEmployer);
  const confirmEmployerSignup = useAuthStore((s) => s.confirmEmployerSignup);
  const resendCode = useAuthStore((s) => s.resendCode);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [requiresCode, setRequiresCode] = useState(true);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const [step1Error, setStep1Error] = useState("");
  const [step1Pending, setStep1Pending] = useState(false);
  const [step2Error, setStep2Error] = useState("");
  const [step2Pending, setStep2Pending] = useState(false);
  const [resendPending, setResendPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
  });

  const onStep1Submit = async (data: Step1Form) => {
    setStep1Error("");
    setStep1Pending(true);
    try {
      const { email: confirmedEmail, requiresCode: needsCode } =
        await registerEmployer(data);
      setEmail(confirmedEmail);
      setRequiresCode(needsCode);
      setStep(2);
    } catch (err: any) {
      setStep1Error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setStep1Pending(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresCode && !code.trim()) {
      setCodeError("Confirmation Code is required");
      return;
    }

    setCodeError("");
    setStep2Error("");
    setStep2Pending(true);
    try {
      await confirmEmployerSignup({ email, code, file: logoFile });
      navigate("/employers/dashboard");
    } catch (err: any) {
      setStep2Error(getErrorMessage(err, "Failed to confirm signup"));
    } finally {
      setStep2Pending(false);
    }
  };

  const handleResend = async () => {
    setResendPending(true);
    try {
      await resendCode({ email });
    } finally {
      setResendPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <p className="text-sm text-ink/40 mb-1">{step} of 2</p>
      <h1 className="text-3xl font-bold text-ink mb-2">
        {step === 1 ? "Create Employer Account" : "Company Logo"}
      </h1>

      {step === 1 ? (
        <>
          <p className="text-ink/60 mb-8">
            Set up your company profile to start posting jobs and reviewing
            applicants.
          </p>

          <form noValidate onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
            <FormField label="Email Address *" error={errors.email}>
              <input
                id="signup-email"
                {...register("email")}
                type="email"
                placeholder="Email Address"
                className={inputClass(!!errors.email)}
              />
            </FormField>

            <FormField
              label="Password *"
              error={errors.password}
              hint="Password must be at least ten (10) characters and should be a mix of uppercase and lowercase characters, numbers, and punctuations"
            >
              <input
                id="signup-password"
                {...register("password")}
                type="password"
                placeholder="Password"
                className={inputClass(!!errors.password)}
              />
            </FormField>

            <FormField label="Confirm Password *" error={errors.confirmPassword}>
              <input
                id="signup-confirm-password"
                {...register("confirmPassword")}
                type="password"
                placeholder="Confirm Password"
                className={inputClass(!!errors.confirmPassword)}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First Name *" error={errors.firstName}>
                <input
                  id="signup-first-name"
                  {...register("firstName")}
                  placeholder="First Name"
                  className={inputClass(!!errors.firstName)}
                />
              </FormField>
              <FormField label="Last Name *" error={errors.lastName}>
                <input
                  id="signup-last-name"
                  {...register("lastName")}
                  placeholder="Last Name"
                  className={inputClass(!!errors.lastName)}
                />
              </FormField>
            </div>

            <FormField label="Mobile Number *" error={errors.mobileNumber}>
              <input
                id="signup-mobile"
                {...register("mobileNumber")}
                placeholder="Mobile Number"
                className={inputClass(!!errors.mobileNumber)}
              />
            </FormField>

            <FormField label="Company Name *" error={errors.companyName}>
              <input
                id="signup-company-name"
                {...register("companyName")}
                placeholder="Company Name"
                className={inputClass(!!errors.companyName)}
              />
            </FormField>

            <FormField
              label={
                <>
                  Company Website <span className="text-ink/40 font-normal">(optional)</span>
                </>
              }
              error={errors.companyWebsite}
            >
              <input
                id="signup-company-website"
                {...register("companyWebsite")}
                placeholder="https://yourcompany.com"
                className={inputClass(!!errors.companyWebsite)}
              />
            </FormField>

            {step1Error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                ⚠️ {step1Error}
              </div>
            )}

            <p className="text-xs text-ink/50 leading-relaxed">
              By proceeding you confirm that you have read, understood and
              agreed to our{" "}
              <Link
                to="/terms"
                className="text-evergreen hover:text-evergreen-dark"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-evergreen hover:text-evergreen-dark"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={step1Pending}
                className="bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                           text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
              >
                {step1Pending ? "Please wait..." : <>Next →</>}
              </button>
            </div>
          </form>
        </>
      ) : (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          <div>
            <p className="text-sm font-medium text-ink mb-2 block">
              Company Logo{" "}
              <span className="text-ink/40 font-normal">(optional)</span>
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm text-ink/50 flex-1">
                {logoFile ? logoFile.name : "No Logo Selected..."}
              </span>
              <FilePicker
                accept={ALLOWED_EXTENSIONS}
                maxBytes={MAX_LOGO_BYTES}
                label="Select Logo"
                icon={ImageIcon}
                typeMessage={`Only files with ${ALLOWED_EXTENSIONS.join(", ")} extensions less than 900kb are allowed`}
                onPick={(file, error) => {
                  setLogoFile(file);
                  setFileError(error);
                }}
              />
            </div>
            <p className="text-xs text-ink/40 mt-2">
              Only files with {ALLOWED_EXTENSIONS.join(", ")} extensions less
              than 900kb are allowed. You can skip this and add it later in
              settings.
            </p>
            <FieldError alert message={fileError} />
          </div>
          {requiresCode && (
            <div className="border-t border-hairline pt-5">
              <p className="text-sm text-ink mb-3">
                Please enter the code sent to{" "}
                <span className="font-semibold">{email}</span>
              </p>
              <FormField label="Confirmation Code *" error={codeError}>
              <input
                id="signup-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Confirmation Code"
                className={inputClass(!!codeError)}
              />
              </FormField>
            </div>
          )}

          {step2Error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {step2Error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={step2Pending}
              className="bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                         text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              {step2Pending ? "Creating account..." : <>Create Account →</>}
            </button>
          </div>
          {requiresCode && (
            <p className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendPending}
                className="text-sm font-medium text-evergreen hover:text-evergreen-dark disabled:opacity-50"
              >
                {resendPending ? "Resending..." : "Resend Confirmation Code"}
              </button>
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default EmployerSignup;
