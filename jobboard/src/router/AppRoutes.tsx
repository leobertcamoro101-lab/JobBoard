import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout";
import HomePage from "../pages/HomePage";
import JobDetailPage from "../pages/JobDetailPage";
import PostJobPage from "../pages/PostJobPage";
import ApplicantLogin from "../pages/ApplicantLogin";
import EmployerLogin from "../pages/EmployerLogin";
import ApplicantSignup from "../pages/ApplicantSignup";
import EmployerSignup from "../pages/EmployerSignup";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/jobs/:id', element: <JobDetailPage /> },
      { path: '/post', element: <PostJobPage /> },
      { path: '/applicants', element: <ApplicantLogin /> },
      { path: '/employers', element: <EmployerLogin /> },
      { path: '/applicants/signup', element: <ApplicantSignup /> },
      { path: '/employers/signup', element: <EmployerSignup /> }
    ],
  },
]);

export default router;