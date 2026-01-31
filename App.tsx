import React, { useState, useEffect } from 'react';
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
import { User,  UserRole } from './types';
import { api, decodeJwt  } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

interface ProtectedRouteProps {
  user: User | null;
  authInitialized: boolean;
  children: React.ReactNode;
  onLogout: () => void;
}


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, onLogout }) => {
        if (!authInitialized) {
        return null; // ou un loader
      }

      if (!user) {
        return <Navigate to="/login" replace />;
      }

    return (
      <Layout user={user} onLogout={onLogout}>
        {children}
      </Layout>
    );
  };

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('accessToken');

      if (token) {
        try {
          const decoded = decodeJwt(token);

          const role =
            Array.isArray(decoded.roles) &&
            decoded.roles.length > 0 &&
            typeof decoded.roles[0] === 'string'
              ? (decoded.roles[0].toUpperCase() as UserRole)
              : 'USER';

          setUser({
            id: String(decoded.id),
            username: decoded.username,
            fullName: decoded.fullName || decoded.username,
            role,
          });
        } catch {
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }

      setAuthInitialized(true);
    };

    initAuth();
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>

          <Route
            path="/login"
            element={
              authInitialized && !user
                ? <Login onLogin={handleLogin} />
                : <Navigate to="/" />
            }
          />

          <Route path="/" element={
            <ProtectedRoute user={user} onLogout={handleLogout}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route
            path="/incidents"
            element={
              <ProtectedRoute
                user={user}
                authInitialized={authInitialized}
                onLogout={handleLogout}
              >
                <IncidentList />
              </ProtectedRoute>
            }
          />


          <Route path="/incidents/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewIncident />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:id" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <IncidentDetail userRole={user ? user.role : 'USER'} />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:id/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewIncident />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:id/attachments" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <IncidentAttachments />
            </ProtectedRoute>
          } />

          <Route path="/incidents/:incidentId/tasks/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewTask />
            </ProtectedRoute>
          } />

           <Route path="/incidents/:incidentId/tasks/:taskId/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewTask />
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
             <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
                <TaskList />
             </ProtectedRoute>
          } />

          <Route path="/pilotage" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              {/* Logic to protect route based on role could be here or inside component */}
              {user?.role === 'ADMIN' || user?.role === 'MANAGER' ? <Pilotage /> : <Navigate to="/" />}
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Sites */}
          <Route path="/settings/sites" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <SiteList />
            </ProtectedRoute>
          } />
          <Route path="/settings/sites/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewSite />
            </ProtectedRoute>
          } />
          <Route path="/settings/sites/:id/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewSite />
            </ProtectedRoute>
          } />

          {/* Categories */}
          <Route path="/settings/categories" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <CategoryList />
            </ProtectedRoute>
          } />
          <Route path="/settings/categories/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewCategory />
            </ProtectedRoute>
          } />
          <Route path="/settings/categories/:id/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewCategory />
            </ProtectedRoute>
          } />

          {/* SubCategories */}
          <Route path="/settings/sub-categories" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <SubCategoryList />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-categories/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewSubCategory />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-categories/:id/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewSubCategory />
            </ProtectedRoute>
          } />

          {/* Processes */}
          <Route path="/settings/processes" element={
            <ProtectedRoute user={user} authInitialized={authInitialized}  onLogout={handleLogout}>
              <ProcessList />
            </ProtectedRoute>
          } />
          <Route path="/settings/processes/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewProcess />
            </ProtectedRoute>
          } />
          <Route path="/settings/processes/:id/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewProcess />
            </ProtectedRoute>
          } />

          {/* SubProcesses */}
          <Route path="/settings/sub-processes" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <SubProcessList />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-processes/new" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
              <NewSubProcess />
            </ProtectedRoute>
          } />
          <Route path="/settings/sub-processes/:id/edit" element={
            <ProtectedRoute user={user} authInitialized={authInitialized} onLogout={handleLogout}>
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