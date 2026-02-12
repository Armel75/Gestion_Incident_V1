// src/components/auth/RequireRole.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../types/auth/AuthContext';

interface RequireRoleProps {
  allowedRoles: string[];
}

export const RequireRole = ({ allowedRoles }: RequireRoleProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = user.roles?.some(role =>
    allowedRoles.includes(role)
  );

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
