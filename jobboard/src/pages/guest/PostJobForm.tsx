import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormField from "../../components/FormField";
import { inputClass } from "../../utils/inputClass";
import { createJob, updateJob } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import Card from "../../components/Card";
import type { Job } from "../../types";

const postJobSchema = z.object({
  title: z.string().min(3, "Job title is required"),
  company: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  type: z.enum(["full-time", "part-time", "remote", "contract"]),
  category: z.string().min(1, "Category is required"),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  currency: z.string().min(1).default("PHP"),
  description: z
    .string()
    .min(100, "Description must be at least 100 characters"),
  requirements: z.string().optional(),
  apply_email: z.string().email("Valid email required"),
});

type PostJobValues = z.infer<typeof postJobSchema>;

const CATEGORIES = [
  "Engineering",
  "Design",
  "DevOps",
  "Marketing",
  "Sales",
  "Product",
];

interface Props {
  /** Pass a saved job to edit it; omit to post a new one. */
  job?: Job;
}

const PostJobForm = ({ job }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isEdit = !!job;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostJobValues>({
    resolver: zodResolver(postJobSchema) as any,
    defaultValues: job
      ? {
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          category: job.category,
          salary_min: job.salary_min ? String(Number(job.salary_min)) : "",
          salary_max: job.salary_max ? String(Number(job.salary_max)) : "",
          currency: job.currency || "PHP",
          description: job.description,
          requirements: job.requirements ?? "",
          apply_email: job.apply_email,
        }
      : {
          type: "full-time",
          currency: "PHP",
          category: "Engineering",
          title: "",
          company: user?.employer_profile?.company_name ?? "",
          location: "",
          description: "",
          apply_email: user?.email ?? "",
        },
  });

  const mutation = useMutation({
    mutationFn: (data: PostJobValues) =>
      job ? updateJob(job.id, data) : createJob(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job"] });
      navigate(isEdit ? "/employers/dashboard" : `/jobs/${saved.id}`);
    },
  });

  const categoryOptions =
    job && !CATEGORIES.includes(job.category)
      ? [job.category, ...CATEGORIES]
      : CATEGORIES;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
          {isEdit ? "Edit Job" : "Post a Job"}
        </h1>
        <p className="text-ink/60">
          {isEdit
            ? "Update the details of your posting"
            : "Find your next great hire"}
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-5"
      >
        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Job Details</h2>

          <FormField label="Job Title *" size="compact" error={errors.title}>
            <input
              id="job-title"
              {...register("title")}
              placeholder="e.g. Senior React Developer"
              className={inputClass(!!errors.title)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Company *" size="compact" error={errors.company}>
              <input
                id="job-company"
                {...register("company")}
                placeholder="Your company name"
                className={inputClass(!!errors.company)}
              />
            </FormField>
            <FormField label="Location *" size="compact" error={errors.location}>
              <input
                id="job-location"
                {...register("location")}
                placeholder="e.g. Cebu City or Remote"
                className={inputClass(!!errors.location)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Job Type *" size="compact">
              <select
                id="job-type"
                {...register("type")}
                className={inputClass()}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="remote">Remote</option>
                <option value="contract">Contract</option>
              </select>
            </FormField>
            <FormField label="Category *" size="compact">
              <select
                id="job-category"
                {...register("category")}
                className={inputClass()}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Salary (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Currency" size="compact">
              <select
                id="job-currency"
                {...register("currency")}
                className={inputClass()}
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
              </select>
            </FormField>
            <FormField label="Min Salary" size="compact">
              <input
                id="job-salary-min"
                {...register("salary_min")}
                placeholder="e.g. 50000"
                className={inputClass()}
              />
            </FormField>
            <FormField label="Max Salary" size="compact">
              <input
                id="job-salary-max"
                {...register("salary_max")}
                placeholder="e.g. 80000"
                className={inputClass()}
              />
            </FormField>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Description</h2>
          <FormField label="Job Description *" size="compact" error={errors.description}>
            <textarea
              id="job-description"
              {...register("description")}
              rows={6}
              placeholder="Describe the role, responsibilities, and what makes it exciting..."
              className={inputClass(!!errors.description, 'default', 'resize-none')}
            />
          </FormField>
          <FormField label={<>Requirements <span className="text-ink/40">(one per line)</span></>} size="compact">
            <textarea
              id="job-requirements"
              {...register("requirements")}
              rows={4}
              placeholder="5+ years React experience&#10;TypeScript proficiency&#10;..."
              className={inputClass(false, 'default', 'resize-none')}
            />
          </FormField>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Contact</h2>
          <FormField label="Application Email *" size="compact" error={errors.apply_email}>
            <input
              id="job-apply-email"
              {...register("apply_email")}
              type="email"
              placeholder="jobs@yourcompany.com"
              className={inputClass(!!errors.apply_email)}
            />
          </FormField>
        </Card>

        {mutation.error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            ⚠️{" "}
            {(mutation.error as any)?.response?.data?.message ||
              (isEdit
                ? "Failed to save changes. Please try again."
                : "Failed to post job. Please try again.")}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
          {isEdit && (
            <Link
              to="/employers/dashboard"
              className="text-center px-6 py-4 rounded-2xl border border-hairline text-ink/70
                         font-medium hover:bg-paper transition-colors"
            >
              Cancel
            </Link>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-evergreen hover:bg-evergreen-dark disabled:opacity-50
                       text-white font-bold py-4 rounded-2xl transition-colors text-lg"
          >
            {mutation.isPending
              ? isEdit
                ? "Saving..."
                : "Posting..."
              : isEdit
                ? "Save Changes →"
                : "Post Job →"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJobForm;
