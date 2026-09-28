import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout";
import ProtectedRoute from "../navigation/ProtectedRoute";
import HomePage from "../pages/guest/HomePage";
import JobDetailPage from "../pages/guest/JobDetailPage";
import PostJobPage from "../pages/guest/PostJobPage";
import ApplicantLogin from "../pages/guest/ApplicantLogin";
import EmployerLogin from "../pages/guest/EmployerLogin";
import ApplicantSignup from "../pages/guest/ApplicantSignup";
import EmployerSignup from "../pages/guest/EmployerSignup";
import ApplicantDashboard from "../pages/authenticated/ApplicantDashboard";
import EmployerDashboard from "../pages/authenticated/EmployerDashboard";
import JobApplicantsPage from "../pages/authenticated/JobApplicantsPage";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/jobs/:id', element: <JobDetailPage /> },
      { path: '/applicants', element: <ApplicantLogin /> },
      { path: '/employers', element: <EmployerLogin /> },
      { path: '/applicants/signup', element: <ApplicantSignup /> },
      { path: '/employers/signup', element: <EmployerSignup /> },
      {
        path: '/applicants/dashboard',
        element: (
          <ProtectedRoute role="applicant">
            <ApplicantDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employers/dashboard',
        element: (
          <ProtectedRoute role="employer">
            <EmployerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/post',
        element: (
          <ProtectedRoute role="employer">
            <PostJobPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/employers/jobs/:id/applicants',
        element: (
          <ProtectedRoute role="employer">
            <JobApplicantsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;