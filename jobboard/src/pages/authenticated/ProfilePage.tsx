import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import FieldError from '../../components/FieldError';
import FormField from '../../components/FormField';
import FilePicker from '../../components/FilePicker';
import { updateProfile } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import Card from "../../components/Card";

const MAX_BYTES = 900 * 1024;
const RESUME_EXT = [".doc", ".docx", ".odt", ".pdf", ".rtf"];
const LOGO_EXT = [".jpg", ".jpeg", ".png", ".webp"];

const schema = z.object({
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last Name is required"),
  mobile_number: z.string().min(1, "Mobile Number is required"),
  company_name: z.string().optional(),
  company_website: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type ProfileForm = z.infer<typeof schema>;

const inputClass = (hasError?: boolean) =>
  `w-full bg-paper border ${hasError ? "border-red-400" : "border-hairline"}
   text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
   transition-colors placeholder-ink/40`;

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const isEmployer = user?.role === "employer";

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [allowView, setAllowView] = useState(
    user?.applicant_profile?.allow_view ?? true,
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      mobile_number: user?.mobile_number ?? "",
      company_name: user?.employer_profile?.company_name ?? "",
      company_website: user?.employer_profile?.company_website ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      useAuthStore.setState({ user: updated });
      setFile(null);
      setRemoveLogo(false);
      setFileError("");
    },
    onError: (err: any) => {
      const errs = err?.response?.data?.errors ?? {};
      (
        [
          "first_name",
          "last_name",
          "mobile_number",
          "company_name",
          "company_website",
        ] as const
      ).forEach((k) => {
        if (errs[k]) setError(k, { message: errs[k][0] });
      });
      const fileMsg = errs.resume?.[0] ?? errs.logo?.[0];
      if (fileMsg) setFileError(fileMsg);
    },
  });

  if (!user) return null;

  const allowedExt = isEmployer ? LOGO_EXT : RESUME_EXT;
  const currentLogo = user.employer_profile?.company_logo_url;
  const currentResume = user.applicant_profile?.resume_url;

  const handlePick = (picked: File | null, error: string) => {
    setFile(picked);
    setFileError(error);
    if (picked) setRemoveLogo(false);
  };

  const onSubmit = (d: ProfileForm) => {
    if (isEmployer && !d.company_name?.trim()) {
      setError("company_name", { message: "Company Name is required" });
      return;
    }

    const fd = new FormData();
    fd.append("first_name", d.first_name);
    fd.append("last_name", d.last_name);
    fd.append("mobile_number", d.mobile_number);

    if (isEmployer) {
      fd.append("company_name", d.company_name ?? "");
      fd.append("company_website", d.company_website ?? "");
      if (file) fd.append("logo", file);
      else if (removeLogo) fd.append("remove_logo", "1");
    } else {
      if (file) fd.append("resume", file);
      fd.append("allow_view", allowView ? "1" : "0");
    }

    mutation.mutate(fd);
  };

  const status = (mutation.error as any)?.response?.status;
  const showServerBanner = mutation.isError && status !== 422;

  const pickerButton = (label: string, icon: typeof FileText) => (
    <FilePicker accept={allowedExt} maxBytes={MAX_BYTES} label={label} icon={icon} onPick={handlePick} />
  );

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">
        Edit profile
      </h1>
      <p className="text-ink/60 mb-6">
        {isEmployer
          ? "Update your details and company profile."
          : "Update your details and resume."}
      </p>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label="Email"
            hint="Your email is your login and can't be changed here."
          >
            <input
              id="profile-email"
              value={user.email}
              disabled
              className="w-full bg-hairline/40 border border-hairline text-ink/60 text-sm rounded-xl px-4 py-3"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" error={errors.first_name}>
              <input
                id="profile-first-name"
                {...register("first_name")}
                className={inputClass(!!errors.first_name)}
              />
            </FormField>
            <FormField label="Last Name" error={errors.last_name}>
              <input
                id="profile-last-name"
                {...register("last_name")}
                className={inputClass(!!errors.last_name)}
              />
            </FormField>
          </div>

          <FormField label="Mobile Number" error={errors.mobile_number}>
            <input
              id="profile-mobile"
              {...register("mobile_number")}
              className={inputClass(!!errors.mobile_number)}
            />
          </FormField>

          {isEmployer ? (
            <>
              <FormField label="Company Name" error={errors.company_name}>
                <input
                  id="profile-company-name"
                  {...register("company_name")}
                  className={inputClass(!!errors.company_name)}
                />
              </FormField>

              <FormField label={<>Company Website <span className="text-ink/40 font-normal">(optional)</span></>} error={errors.company_website}>
                <input
                  id="profile-company-website"
                  {...register("company_website")}
                  placeholder="https://yourcompany.com"
                  className={inputClass(!!errors.company_website)}
                />
              </FormField>

              <div>
                <p className="text-sm font-medium text-ink mb-2 block">
                  Company Logo
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {currentLogo && !removeLogo ? (
                    <img
                      src={currentLogo}
                      alt="Company logo"
                      className="w-16 h-16 rounded-xl object-cover border border-hairline shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-xl bg-evergreen/10 text-evergreen font-bold text-xl
                                    flex items-center justify-center shrink-0"
                    >
                      {(user.employer_profile?.company_name || "C").charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-ink/50 flex-1 break-all">
                    {file
                      ? file.name
                      : removeLogo
                        ? "Logo will be removed"
                        : currentLogo
                          ? "Current logo"
                          : "No logo yet"}
                  </span>
                  {pickerButton(
                    currentLogo ? "Replace logo" : "Select logo",
                    ImageIcon,
                  )}
                </div>
                {currentLogo && !file && (
                  <label className="flex items-center gap-2 text-sm text-ink/70 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeLogo}
                      onChange={(e) => setRemoveLogo(e.target.checked)}
                      className="w-4 h-4 rounded border-hairline accent-evergreen"
                    />
                    Remove my logo
                  </label>
                )}
                <p className="text-xs text-ink/40 mt-2">
                  {LOGO_EXT.join(", ")} files under 900kb.
                </p>
                <FieldError alert message={fileError} />
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm font-medium text-ink mb-2 block">Resume</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-sm text-ink/50 flex-1 break-all">
                  {file ? (
                    file.name
                  ) : currentResume ? (
                    <a
                      href={currentResume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-evergreen hover:text-evergreen-dark font-medium underline underline-offset-2"
                    >
                      View current resume
                    </a>
                  ) : (
                    "No resume uploaded"
                  )}
                </span>
                {pickerButton(
                  currentResume ? "Replace resume" : "Select resume",
                  FileText,
                )}
              </div>
              <p className="text-xs text-ink/40 mt-2">
                {RESUME_EXT.join(", ")} files under 900kb.
              </p>
              <FieldError alert message={fileError} />

              <label className="flex items-start gap-2 text-sm text-ink cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={allowView}
                  onChange={(e) => setAllowView(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-hairline accent-evergreen shrink-0"
                />
                <span>
                  Allow companies to view my resume
                  <span className="block text-xs text-ink/40 mt-0.5">
                    Employers only see it on applications you send while this is
                    on.
                  </span>
                </span>
              </label>
            </div>
          )}

          {mutation.isSuccess && (
            <div
              role="status"
              className="flex items-center gap-2 bg-evergreen/10 border border-evergreen/20 text-evergreen
                            rounded-xl px-4 py-3 text-sm"
            >
              <CheckCircle2 size={16} /> Profile updated.
            </div>
          )}

          {showServerBanner && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️{" "}
              {(mutation.error as any)?.response?.data?.message ||
                "Something went wrong. Please try again."}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                       text-white font-bold py-3 rounded-xl transition-colors"
          >
            {mutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
