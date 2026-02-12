import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission } from './permissions';
import { Layout } from '../../../components/Layout';

type Props = {
  permission?: string;
  user: any;
  onLogout: () => void;
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<Props> = ({
  user,
  onLogout,
  children
}) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      {children}
    </Layout>
  );
};
