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
import FieldError, { fieldA11y } from '../../components/FieldError';
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

// const FieldError = ({ message }: { message?: string }) =>
//   message ? (
//     <p className="flex items-center gap-1.5 text-red-600 text-sm mt-1.5">
//       <AlertCircle size={14} /> {message}
//     </p>
//   ) : null;

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    const ext = "." + picked.name.split(".").pop()?.toLowerCase();
    if (!allowedExt.includes(ext)) {
      setFileError(`Only ${allowedExt.join(", ")} files are allowed`);
      setFile(null);
    } else if (picked.size > MAX_BYTES) {
      setFileError("File must be less than 900kb");
      setFile(null);
    } else {
      setFileError("");
      setFile(picked);
      setRemoveLogo(false);
    }
    e.target.value = "";
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

  const pickerButton = (label: string, Icon: typeof FileText) => (
    <label
      className="cursor-pointer inline-flex items-center justify-center gap-2
                      border border-evergreen text-evergreen hover:bg-evergreen/5
                      text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
    >
      <Icon size={16} /> {label}
      <input
        type="file"
        accept={allowedExt.join(",")}
        onChange={handleFile}
        className="hidden"
      />
    </label>
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
          <div>
            <label
              htmlFor="profile-email"
              className="text-sm font-medium text-ink mb-1.5 block"
            >
              Email
            </label>
            <input
              id="profile-email"
              // {...fieldA11y('profile-email', errors.email?.message)}
              value={user.email}
              disabled
              className="w-full bg-hairline/40 border border-hairline text-ink/60 text-sm rounded-xl px-4 py-3"
            />
            <p className="text-xs text-ink/40 mt-1.5">
              Your email is your login and can't be changed here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-first-name"
                className="text-sm font-medium text-ink mb-1.5 block"
              >
                First Name
              </label>
              <input
                id="profile-first-name"
                {...register("first_name")}
                {...fieldA11y('profile-first-name', errors.first_name?.message)}
                className={inputClass(!!errors.first_name)}
              />
              <FieldError id="profile-first-name" message={errors.first_name?.message} />
            </div>
            <div>
              <label
                htmlFor="profile-last-name"
                className="text-sm font-medium text-ink mb-1.5 block"
              >
                Last Name
              </label>
              <input
                id="profile-last-name"
                {...register("last_name")}
                {...fieldA11y('profile-last-name', errors.last_name?.message)}
                className={inputClass(!!errors.last_name)}
              />
              <FieldError id="profile-last-name" message={errors.last_name?.message} />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-mobile"
              className="text-sm font-medium text-ink mb-1.5 block"
            >
              Mobile Number
            </label>
            <input
              id="profile-mobile"
              {...register("mobile_number")}
              {...fieldA11y('profile-mobile', errors.mobile_number?.message)}
              className={inputClass(!!errors.mobile_number)}
            />
            <FieldError  id="profile-mobile" message={errors.mobile_number?.message} />
          </div>

          {isEmployer ? (
            <>
              <div>
                <label
                  htmlFor="profile-company-name"
                  className="text-sm font-medium text-ink mb-1.5 block"
                >
                  Company Name
                </label>
                <input
                  id="profile-company-name"
                  {...register("company_name")}
                  {...fieldA11y('profile-company-name', errors.company_name?.message)}
                  className={inputClass(!!errors.company_name)}
                />
                <FieldError message={errors.company_name?.message} />
              </div>

              <div>
                <label
                  htmlFor="profile-company-website"
                  className="text-sm font-medium text-ink mb-1.5 block"
                >
                  Company Website{" "}
                  <span className="text-ink/40 font-normal">(optional)</span>
                </label>
                <input
                  id="profile-company-website"
                  {...register("company_website")}
                  {...fieldA11y('profile-company-name', errors.company_website?.message)}
                  placeholder="https://yourcompany.com"
                  className={inputClass(!!errors.company_website)}
                />
                <FieldError id="profile-company-website" message={errors.company_website?.message} />
              </div>

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
                <FieldError message={fileError} />
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
              <FieldError message={fileError} />

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
              className="flex items-center gap-2 bg-evergreen/10 border border-evergreen/20 text-evergreen
                            rounded-xl px-4 py-3 text-sm"
            >
              <CheckCircle2 size={16} /> Profile updated.
            </div>
          )}

          {showServerBanner && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
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
