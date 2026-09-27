import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types';

interface Props {
  role?: UserRole;
  children: React.ReactNode;
}

const ProtectedRoute = ({ role, children }: Props) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const loginPath = role === 'employer' ? '/employers' : '/applicants';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    // Logged in, but as the wrong role — send them to their own dashboard instead of a dead end
    const ownDashboard = user.role === 'employer' ? '/employers/dashboard' : '/applicants/dashboard';
    return <Navigate to={ownDashboard} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;