import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getJob } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";
import PostJobForm from "./PostJobForm";

const PostJobPage = () => {
  const user = useAuthStore((s) => s.user);

  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(Number(id)),
    enabled: isEdit,
  });

  if (!isEdit) return <PostJobForm />;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-hairline/60 rounded w-1/2" />
        <div className="h-64 bg-hairline/40 rounded-2xl" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          ⚠️ Job not found.
        </div>
      </div>
    );
  }

  if (Number(job.employer_id) !== user?.id) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          ⚠️ You can only edit jobs that you posted.
        </div>
      </div>
    );
  }

  // The form mounts only once the job is here, so it starts with the saved
  // values instead of filling itself in afterwards.
  return <PostJobForm key={job.id} job={job} />;
};

export default PostJobPage;
