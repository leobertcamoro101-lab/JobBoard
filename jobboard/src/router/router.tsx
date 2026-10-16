import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout";
import RouteError from "./RouteError";
import ProtectedRoute from "../navigation/ProtectedRoute";
import {
  HomePage,
  JobDetailPage,
  PostJobPage,
  ApplicantLogin,
  EmployerLogin,
  ApplicantSignup,
  EmployerSignup,
  ApplicantDashboard,
  EmployerDashboard,
  JobApplicantsPage,
  ChangePasswordPage,
  ProfilePage,
} from "./routes-config";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
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
        path: '/employers/jobs/:id/edit',
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
      {
        path: '/account/password',
        element: (
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/account/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router;