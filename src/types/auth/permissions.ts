import { decodeJwt } from '../../../services/api';

export const getPermissions = (): string[] => {
  const token = localStorage.getItem('accessToken');
  if (!token) return [];

  try {
    const decoded = decodeJwt(token);
    return decoded.permissions ?? [];
  } catch {
    return [];
  }
};

export const hasPermission = (permission: string): boolean => {
  return getPermissions().includes(permission);
};
