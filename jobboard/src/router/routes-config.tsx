import { lazy } from "react";
import HomePage from "../pages/guest/HomePage";

// export const HomePage = lazy(() => import('../pages/guest/HomePage'));
export { HomePage };
export const JobDetailPage = lazy(() => import('../pages/guest/JobDetailPage'));
export const PostJobPage = lazy(() => import('../pages/guest/PostJobPage'));
export const ApplicantLogin = lazy(() => import('../pages/guest/ApplicantLogin'));
export const EmployerLogin = lazy(() => import('../pages/guest/EmployerLogin'));
export const ApplicantSignup = lazy(() => import('../pages/guest/ApplicantSignup'));
export const EmployerSignup = lazy(() => import('../pages/guest/EmployerSignup'));
export const ApplicantDashboard = lazy(() => import('../pages/authenticated/ApplicantDashboard'));
export const EmployerDashboard = lazy(() => import('../pages/authenticated/EmployerDashboard'));
export const JobApplicantsPage = lazy(() => import('../pages/authenticated/JobApplicantsPage'));
export const ChangePasswordPage = lazy(() => import('../pages/authenticated/ChangePassword'));
export const ProfilePage = lazy(() => import('../pages/authenticated/ProfilePage'));