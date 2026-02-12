import { useAuth } from './AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions?.includes(permission) ?? false;
    //user.permissions.includes(permission);
  };

  return { hasPermission };
};
