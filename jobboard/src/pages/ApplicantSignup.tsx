import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const MAX_RESUME_BYTES = 900 * 1024; // 900kb
const ALLOWED_EXTENSIONS = ['.doc', '.docx', '.odt', '.pdf', '.rtf'];

const step1Schema = z.object({
  email: z.string().min(1, 'Email Address is required').email('Enter a valid email'),
  password: z
    .string()
    .min(10, 'Password must be at least ten (10) characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include punctuation'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  mobileNumber: z.string().min(1, 'Mobile Number is required'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Step1Form = z.infer<typeof step1Schema>;

const inputClass = (hasError?: boolean) =>
  `w-full bg-paper border ${hasError ? 'border-red-400' : 'border-hairline'}
   text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
   transition-colors placeholder-ink/40`;

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="flex items-center gap-1.5 text-red-600 text-sm mt-1.5">
      <AlertCircle size={14} /> {message}
    </p>
  ) : null;

const ApplicantSignup = () => {
  const navigate = useNavigate();
  const registerApplicant = useAuthStore((s) => s.registerApplicant);
  const confirmApplicantSignup = useAuthStore((s) => s.confirmApplicantSignup);
  const resendCode = useAuthStore((s) => s.resendCode);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [allowView, setAllowView] = useState(true);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const [step1Error, setStep1Error] = useState('');
  const [step1Pending, setStep1Pending] = useState(false);
  const [step2Error, setStep2Error] = useState('');
  const [step2Pending, setStep2Pending] = useState(false);
  const [resendPending, setResendPending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
  });

  const onStep1Submit = async (data: Step1Form) => {
    setStep1Error('');
    setStep1Pending(true);
    try {
      const { email: confirmedEmail } = await registerApplicant(data);
      setEmail(confirmedEmail);
      setStep(2);
    } catch (err: any) {
      setStep1Error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setStep1Pending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Only files with ${ALLOWED_EXTENSIONS.join(', ')} extensions less than 900kb are allowed`);
      setResumeFile(null);
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setFileError('File must be less than 900kb');
      setResumeFile(null);
      return;
    }
    setFileError('');
    setResumeFile(file);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      setFileError('Please select a resume file');
      return;
    }
    if (!code.trim()) {
      setCodeError('Confirmation Code is required');
      return;
    }
    setCodeError('');
    setStep2Error('');
    setStep2Pending(true);
    try {
      await confirmApplicantSignup({ email, code, file: resumeFile, allowView });
      navigate('/');
    } catch (err: any) {
      setStep2Error(err?.response?.data?.message || 'Failed to confirm signup');
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
      <h1 className="text-3xl font-bold text-ink mb-2">Upload Resume</h1>

      {step === 1 ? (
        <>
          <p className="text-ink/60 mb-8">
            Got a resume file ready? Upload it here to immediately send your application.
          </p>

          <form onSubmit={handleSubmit(onStep1Submit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Email Address *</label>
              <input {...register('email')} type="email" placeholder="Email Address"
                className={inputClass(!!errors.email)} />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Password *</label>
              <input {...register('password')} type="password" placeholder="Password"
                className={inputClass(!!errors.password)} />
              <p className="text-xs text-ink/40 mt-1.5">
                Password must be at least ten (10) characters and should be a mix of uppercase and
                lowercase characters, numbers, and punctuations
              </p>
              <FieldError message={errors.password?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Confirm Password *</label>
              <input {...register('confirmPassword')} type="password" placeholder="Confirm Password"
                className={inputClass(!!errors.confirmPassword)} />
              <FieldError message={errors.confirmPassword?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">First Name *</label>
              <input {...register('firstName')} placeholder="First Name"
                className={inputClass(!!errors.firstName)} />
              <FieldError message={errors.firstName?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Last Name *</label>
              <input {...register('lastName')} placeholder="Last Name"
                className={inputClass(!!errors.lastName)} />
              <FieldError message={errors.lastName?.message} />
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Mobile Number *</label>
              <input {...register('mobileNumber')} placeholder="Mobile Number"
                className={inputClass(!!errors.mobileNumber)} />
              <FieldError message={errors.mobileNumber?.message} />
            </div>

            {step1Error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                ⚠️ {step1Error}
              </div>
            )}

            <p className="text-xs text-ink/50 leading-relaxed">
              By proceeding you confirm that you have read, understood and agreed to our{' '}
              <Link to="/terms" className="text-evergreen hover:text-evergreen-dark">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="text-evergreen hover:text-evergreen-dark">Privacy Policy</Link>.
            </p>

            <div className="flex justify-end">
              <button type="submit" disabled={step1Pending}
                className="bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                           text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
                {step1Pending ? 'Please wait...' : <>Next →</>}
              </button>
            </div>
          </form>
        </>
      ) : (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">Resume *</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm text-ink/50 flex-1">
                {resumeFile ? resumeFile.name : 'No Resume Selected...'}
              </span>
              <label className="cursor-pointer inline-flex items-center justify-center gap-2
                                border border-evergreen text-evergreen hover:bg-evergreen/5
                                text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0">
                <FileText size={16} /> Select Resume
                <input type="file" accept={ALLOWED_EXTENSIONS.join(',')} onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-ink/40 mt-2">
              Only files with {ALLOWED_EXTENSIONS.join(', ')} extensions less than 900kb are allowed
            </p>
            <FieldError message={fileError} />
          </div>

          <label className="flex items-start gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" checked={allowView} onChange={(e) => setAllowView(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-hairline text-evergreen focus:ring-evergreen accent-evergreen shrink-0" />
            <span>
              Allow companies to view my resume
              <span className="block text-xs text-ink/40 mt-0.5">
                Tip: Increase your chances of interview invites. You can update this anytime in your settings.
              </span>
            </span>
          </label>

          <div className="border-t border-hairline pt-5">
            <p className="text-sm text-ink mb-3">
              Please enter the code sent to <span className="font-semibold">{email}</span>
            </p>
            <label className="text-sm font-medium text-ink mb-1.5 block">Confirmation Code *</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Confirmation Code"
              className={inputClass(!!codeError)} />
            <FieldError message={codeError} />
          </div>

          {step2Error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {step2Error}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={step2Pending}
              className="bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                         text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
              {step2Pending ? 'Uploading...' : <>Upload Resume →</>}
            </button>
          </div>

          <p className="text-center">
            <button type="button" onClick={handleResend} disabled={resendPending}
              className="text-sm font-medium text-evergreen hover:text-evergreen-dark disabled:opacity-50">
              {resendPending ? 'Resending...' : 'Resend Confirmation Code'}
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default ApplicantSignup;