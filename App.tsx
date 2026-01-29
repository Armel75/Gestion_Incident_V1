import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IncidentList } from './pages/IncidentList';
import { IncidentDetail } from './pages/IncidentDetail';
import { NewIncident } from './pages/NewIncident';
import { Login } from './pages/Login';
import { Pilotage } from './pages/Pilotage';
import { Settings } from './pages/Settings';
import { TaskList } from './pages/TaskList';
import { NewTask } from './pages/NewTask';
import { IncidentAttachments } from './pages/IncidentAttachments';
import { TaskAttachments } from './pages/TaskAttachments';
import { SiteList } from './pages/SiteList';
import { NewSite } from './pages/NewSite';
import { CategoryList } from './pages/CategoryList';
import { NewCategory } from './pages/NewCategory';
import { SubCategoryList } from './pages/SubCategoryList';
import { NewSubCategory } from './pages/NewSubCategory';
import { ProcessList } from './pages/ProcessList';
import { NewProcess } from './pages/NewProcess';
import { SubProcessList } from './pages/SubProcessList';
import { NewSubProcess } from './pages/NewSubProcess';
import { User } from './types';
import { api } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  onLogout: () => void;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, onLogout }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
      <Layout user={user} onLogout={onLogout}>
          {children}
      </Layout>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/incidents" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <IncidentList />
            </ProtectedRoute>
          } />

           <Route path="/incidents/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewIncident />
            </ProtectedRoute>
          } />
          
          <Route path="/incidents/:id" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <IncidentDetail userRole={user ? user.role : 'USER'} />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:id/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewIncident />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:id/attachments" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <IncidentAttachments />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:incidentId/tasks/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewTask />
            </ProtectedRoute>
          } />

           <Route path="/incidents/:incidentId/tasks/:taskId/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewTask />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:incidentId/tasks/:taskId/attachments" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <TaskAttachments />
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
             <ProtectedRoute user={user} onLogout={handleLogout}>
                <TaskList />
             </ProtectedRoute>
          } />

          <Route path="/pilotage" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              {/* Logic to protect route based on role could be here or inside component */}
              {user?.role === 'ADMIN' || user?.role === 'MANAGER' ? <Pilotage /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Sites */}
          <Route path="/settings/sites" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <SiteList />
            </ProtectedRoute>
          } />
          <Route path="/settings/sites/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewSite />
            </ProtectedRoute>
          } />
          <Route path="/settings/sites/:id/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewSite />
            </ProtectedRoute>
          } />

          {/* Categories */}
          <Route path="/settings/categories" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <CategoryList />
            </ProtectedRoute>
          } />
          <Route path="/settings/categories/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewCategory />
            </ProtectedRoute>
          } />
          <Route path="/settings/categories/:id/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewCategory />
            </ProtectedRoute>
          } />

          {/* SubCategories */}
          <Route path="/settings/sub-categories" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <SubCategoryList />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-categories/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewSubCategory />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-categories/:id/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewSubCategory />
            </ProtectedRoute>
          } />

          {/* Processes */}
          <Route path="/settings/processes" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <ProcessList />
            </ProtectedRoute>
          } />
          <Route path="/settings/processes/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewProcess />
            </ProtectedRoute>
          } />
          <Route path="/settings/processes/:id/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewProcess />
            </ProtectedRoute>
          } />

          {/* SubProcesses */}
          <Route path="/settings/sub-processes" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <SubProcessList />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-processes/new" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewSubProcess />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-processes/:id/edit" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <NewSubProcess />
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