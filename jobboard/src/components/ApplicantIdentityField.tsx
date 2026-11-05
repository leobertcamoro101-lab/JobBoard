import { Link } from "react-router-dom";
import type { Location } from "react-router-dom";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { User } from "../types";
import type { ApplyForm } from "../schemas/applySchema";
import FormField from "./FormField";
import { inputClass } from "../utils/inputClass";

interface Props {
  user: User | null;
  location: Location;
  register: UseFormRegister<ApplyForm>;
  errors: FieldErrors<ApplyForm>;
}

const ApplicantIdentityField = ({ user, location, register, errors }: Props) => {
  const isApplicant = user?.role === "applicant";
  const profile = user?.applicant_profile;

  if (isApplicant) {
    return (
      <div className="bg-paper border border-hairline rounded-xl px-4 py-3">
        <p className="text-ink/50 text-xs mb-0.5">Applying as</p>
        <p className="text-ink font-medium text-sm break-words">{user.name}</p>
        <p className="text-ink/60 text-sm break-all">{user.email}</p>
        {profile?.resume_url && (
          <p className="text-ink/50 text-xs mt-2">
            {profile.allow_view
              ? "Your uploaded resume will be visible to this employer."
              : "Your resume is set to private, so this employer won’t see it."}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {!user && (
        <p className="text-ink/60 text-xs">
          Have an account?{" "}
          <Link to="/applicants" state={{ from: location }}
            className="text-evergreen hover:text-evergreen-dark font-medium">
            Log in
          </Link>{" "}
          to apply faster.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name *" size="compact" error={errors.name}>
          <input id="apply-name" {...register("name")}
            placeholder="John Doe" className={inputClass(!!errors.name, 'compact')} />
        </FormField>
        <FormField label="Email *" size="compact" error={errors.email}>
          <input id="apply-email" {...register("email")}
            type="email" placeholder="john@example.com" className={inputClass(!!errors.email, 'compact')} />
        </FormField>
      </div>
    </>
  );
};

export default ApplicantIdentityField;