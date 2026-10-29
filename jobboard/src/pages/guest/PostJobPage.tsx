import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import FieldError, { fieldA11y } from "../../components/FieldError";
import { createJob, getJob, updateJob } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import Card from "../../components/Card";

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

type PostJobForm = z.infer<typeof postJobSchema>;

const CATEGORIES = [
  "Engineering",
  "Design",
  "DevOps",
  "Marketing",
  "Sales",
  "Product",
];

const PostJobPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const jobId = Number(id);

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(jobId),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PostJobForm>({
    resolver: zodResolver(postJobSchema) as any,
    defaultValues: {
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

  // Edit mode: fill the form once the job loads
  useEffect(() => {
    if (!job) return;
    reset({
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
    });
  }, [job, reset]);

  const mutation = useMutation({
    mutationFn: (data: PostJobForm) =>
      isEdit ? updateJob(jobId, data) : createJob(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["employer-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job"] });
      navigate(isEdit ? "/employers/dashboard" : `/jobs/${saved.id}`);
    },
  });

  const inputClass = (hasError?: boolean) =>
    `w-full bg-paper border ${hasError ? "border-red-400" : "border-hairline"}
     text-ink text-sm rounded-xl px-4 py-3 outline-none focus:border-evergreen
     transition-colors placeholder-ink/40`;

  if (isEdit && jobLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-hairline/60 rounded w-1/2" />
        <div className="h-64 bg-hairline/40 rounded-2xl" />
      </div>
    );
  }

  if (isEdit && (jobError || !job)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          ⚠️ Job not found.
        </div>
      </div>
    );
  }

  if (isEdit && job && Number(job.employer_id) !== user?.id) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          ⚠️ You can only edit jobs that you posted.
        </div>
      </div>
    );
  }

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
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-5"
      >
        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Job Details</h2>

          <div>
            <label
              htmlFor="job-title"
              className="text-xs text-ink/60 mb-1 block"
            >
              Job Title *
            </label>
            <input
              id="job-title"
              {...register("title")}
              {...fieldA11y('job-title', errors.title?.message)}
              placeholder="e.g. Senior React Developer"
              className={inputClass(!!errors.title)}
            />
            <FieldError compact id="job-title" message={errors.title?.message} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="job-company"
                className="text-xs text-ink/60 mb-1 block"
              >
                Company *
              </label>
              <input
                id="job-company"
                {...register("company")}
                {...fieldA11y('job-company', errors.company?.message)}
                placeholder="Your company name"
                className={inputClass(!!errors.company)}
              />
              <FieldError compact id="job-company" message={errors.company?.message} />
            </div>
            <div>
              <label
                htmlFor="job-location"
                className="text-xs text-ink/60 mb-1 block"
              >
                Location *
              </label>
              <input
                id="job-location"
                {...register("location")}
                {...fieldA11y('job-location', errors.location?.message)}
                placeholder="e.g. Cebu City or Remote"
                className={inputClass(!!errors.location)}
              />
               <FieldError compact id="job-company" message={errors.location?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="job-type"
                className="text-xs text-ink/60 mb-1 block"
              >
                Job Type *
              </label>
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
            </div>
            <div>
              <label
                htmlFor="job-category"
                className="text-xs text-ink/60 mb-1 block"
              >
                Category *
              </label>
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
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Salary (Optional)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="job-currency"
                className="text-xs text-ink/60 mb-1 block"
              >
                Currency
              </label>
              <select
                id="job-currency"
                {...register("currency")}
                className={inputClass()}
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="job-salary-min"
                className="text-xs text-ink/60 mb-1 block"
              >
                Min Salary
              </label>
              <input
                id="job-salary-min"
                {...register("salary_min")}
                placeholder="e.g. 50000"
                className={inputClass()}
              />
            </div>
            <div>
              <label
                htmlFor="job-salary-max"
                className="text-xs text-ink/60 mb-1 block"
              >
                Max Salary
              </label>
              <input
                id="job-salary-max"
                {...register("salary_max")}
                placeholder="e.g. 80000"
                className={inputClass()}
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-ink font-bold">Description</h2>
          <div>
            <label
              htmlFor="job-description"
              className="text-xs text-ink/60 mb-1 block"
            >
              Job Description *
            </label>
            <textarea
              id="job-description"
              {...register("description")}
              {...fieldA11y('job-description', errors.description?.message)}
              rows={6}
              placeholder="Describe the role, responsibilities, and what makes it exciting..."
              className={`${inputClass(!!errors.description)} resize-none`}
            />
            <FieldError compact id="job-description" message={errors.description?.message} />
          </div>
          <div>
            <label
              htmlFor="job-requirements"
              className="text-xs text-ink/60 mb-1 block"
            >
              Requirements <span className="text-ink/40">(one per line)</span>
            </label>
            <textarea
              id="job-requirements"
              {...register("requirements")}
              rows={4}
              placeholder="5+ years React experience&#10;TypeScript proficiency&#10;..."
              className={`${inputClass()} resize-none`}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-ink font-bold mb-4">Contact</h2>
          <div>
            <label
              htmlFor="job-apply-email"
              className="text-xs text-ink/60 mb-1 block"
            >
              Application Email *
            </label>
            <input
              id="job-apply-email"
              {...register("apply_email")}
              {...fieldA11y('job-apply-email', errors.apply_email?.message)}
              type="email"
              placeholder="jobs@yourcompany.com"
              className={inputClass(!!errors.apply_email)}
            />
            <FieldError compact id="job-apply-email" message={errors.apply_email?.message} />
          </div>
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

export default PostJobPage;
