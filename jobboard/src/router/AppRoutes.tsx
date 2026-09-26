import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./RootLayout";
import HomePage from "../pages/HomePage";
import JobDetailPage from "../pages/JobDetailPage";
import PostJobPage from "../pages/PostJobPage";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/jobs/:id', element: <JobDetailPage /> },
      { path: '/post', element: <PostJobPage /> },
    ],
  },
]);

export default router;