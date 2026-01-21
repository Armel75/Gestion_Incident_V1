import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IncidentList } from './pages/IncidentList';
import { IncidentDetail } from './pages/IncidentDetail';
import { NewIncident } from './pages/NewIncident';
import { Login } from './pages/Login';
import { Pilotage } from './pages/Pilotage';
import { User } from './types';
import { api } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return (
        <Layout user={user} onLogout={handleLogout}>
            {children}
        </Layout>
    );
  };

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/incidents" element={
            <ProtectedRoute>
              <IncidentList />
            </ProtectedRoute>
          } />

           <Route path="/incidents/new" element={
            <ProtectedRoute>
              <NewIncident />
            </ProtectedRoute>
          } />
          
          <Route path="/incidents/:id" element={
            <ProtectedRoute>
              <IncidentDetail userRole={user ? user.role : 'USER'} />
            </ProtectedRoute>
          } />

          <Route path="/pilotage" element={
            <ProtectedRoute>
              {/* Logic to protect route based on role could be here or inside component */}
              {user?.role === 'ADMIN' || user?.role === 'MANAGER' ? <Pilotage /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;