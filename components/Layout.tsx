import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate  } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertCircle,
  CheckSquare, 
  BarChart2, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  PieChart,
  Command,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Archive
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { Key } from 'lucide-react';
import { ChangePasswordModal } from './ui/ChangePasswordModal';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../src/types/auth/AuthContext';
import logo from '@/template/logo.png';

export const Layout: React.FC = () => {

  // 🔹 TOUS les hooks en premier
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
    
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePwdError, setChangePwdError] = useState<string|null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-800 dark:border-slate-300" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Chargement...
          </span>
        </div>
      </div>
    );
  }

  const roleNames = user?.roles?.map((role) => role.name) ?? [];
  const isAdmin = roleNames.includes('ADMIN');
  const primaryRole = roleNames[0];

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Incidents', href: '/incidents', icon: AlertCircle },
    { name: 'Mes Tâches', href: '/tasks', icon: CheckSquare },
    { name: 'Mes Archives', href: '/archives', icon: Archive },
  ];


  if (isAdmin) {
    navigation.push(
      { name: 'Statistiques', href: '/stats', icon: BarChart2 },
      { name: 'Tableau de pilotage', href: '/pilotage', icon: PieChart }
    );
  }

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const NavItem: React.FC<{ item: any }> = ({ item }) => {
    const active = isActive(item.href);
    return (
      <Link
        to={item.href}
        title={collapsed ? item.name : ''}
        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 mb-1 ${
          active
            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <item.icon
          className={`h-5 w-5 flex-shrink-0 transition-colors ${
            active ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300'
          } ${collapsed ? '' : 'mr-3'}`}
        />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar (Desktop) */}
      <div 
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Logo / Brand Area */}
        <div className={`flex h-14 items-center px-4 border-b border-slate-100 dark:border-slate-800 ${collapsed ? 'justify-center' : 'justify-between'}`}>
           {!collapsed && (
             <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-6 w-6 bg-slate-900 dark:bg-brand-600 rounded-md flex items-center justify-center flex-shrink-0">
                   <Command className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">{APP_NAME}</span>
             </div>
           )}
           {collapsed && (
             <div className="h-8 w-8 bg-slate-900 dark:bg-brand-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">IM</span>
             </div>
           )}
           
           {!collapsed && (
              <button onClick={() => setCollapsed(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <PanelLeftClose className="h-4 w-4" />
              </button>
           )}
        </div>
        
        {/* Toggle Expand Button (When collapsed) */}
        {collapsed && (
          <div className="flex justify-center py-2 border-b border-slate-100 dark:border-slate-800">
             <button onClick={() => setCollapsed(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <PanelLeftOpen className="h-4 w-4" />
             </button>
          </div>
        )}

        {/* Nav Items */}
        <div className="flex flex-col flex-1 overflow-y-auto pt-4 px-3">
          {!collapsed && <div className="mb-2 px-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider animate-in fade-in duration-300">Espace de travail</div>}
          <nav className="flex-1 space-y-0.5">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>
          
          
          {/* Option Changer de thème */}
          <nav className="space-y-0.5 mb-2">
            <button
              type="button"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 mb-1 w-full text-left ${collapsed ? 'justify-center' : ''} text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white`}
              onClick={toggleTheme}
            >
              <svg xmlns="#!" className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              {!collapsed && <span>Changer de couleur</span>}
            </button>
            <button
              type="button"
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 mb-1 w-full text-left ${collapsed ? 'justify-center' : ''} text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white`}
              onClick={() => setShowChangePassword(true)}
            >
              <Key className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span>Modifier mot de passe</span>}
            </button>
          </nav>
          {/* Bloc Compte réservé aux admins */}
          {isAdmin && (
            <>
              {!collapsed && (
                <div className="mt-8 mb-2 px-3 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Compte
                </div>
              )}
              <nav className="space-y-0.5">
                <NavItem item={{ name: 'Paramètres', href: '/settings', icon: Settings }} />
              </nav>
            </>
          )}
        </div>
        {/* User Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <div className="rounded-md bg-slate-50/60 dark:bg-slate-950/30 p-2">
            {/* Ligne du haut */}
            <div className={`flex items-center ${collapsed ? "justify-center" : "justify-start"}`}>
              <img
                className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700"
                src={logo}
                alt="Logo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${import.meta.env.BASE_URL}template/logo.png`;
                }}
              />

              {!collapsed && (
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user?.username ?? "Chargement..."}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate capitalize">
                    {primaryRole?.toLowerCase()}
                  </p>
                </div>
              )}
            </div>

            {/* Ligne du bas */}
            <div className="mt-2">
              <button
                type="button"
                onClick={handleLogout}
                className={[
                  "w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  "bg-red-600 text-white hover:bg-red-700",
                  "dark:bg-red-500 dark:hover:bg-red-600",
                  collapsed ? "px-2" : "",
                ].join(" ")}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Déconnexion</span>}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => { setShowChangePassword(false); setChangePwdError(null); }}
        onSubmit={async (currentPassword, newPassword) => {
          setChangePwdError(null);
          if (!user?.id) throw new Error('Utilisateur non connecté');
          try {
            await api.changeUserPassword(user.id, currentPassword, newPassword);
          } catch (err: any) {
            setChangePwdError(err.message || 'Erreur lors du changement de mot de passe.');
            throw err;
          }
        }}
      />

      {/* Mobile Sidebar (Drawer) */}
      <div className={`lg:hidden fixed inset-0 z-50 flex ${mobileSidebarOpen ? '' : 'pointer-events-none'}`}>
         {/* Backdrop */}
         <div 
            className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMobileSidebarOpen(false)}
         />
         
         {/* Drawer */}
         <div className={`relative flex flex-col w-72 bg-white dark:bg-slate-900 shadow-xl transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex h-14 items-center px-4 border-b border-slate-100 dark:border-slate-800 justify-between">
               <span className="font-semibold text-slate-900 dark:text-white">{APP_NAME}</span>
               <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-500">
                  <PanelLeftClose className="h-5 w-5" />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 mb-1"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </div>
             <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/30">
               <div className="flex items-center mb-4 px-2">
                  <img
                    className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700"
                    src={logo}
                    alt="Logo"
                    onError={(e) => {
                      e.currentTarget.onerror = null; // évite boucle infinie
                      e.currentTarget.src = 'template/logo.png'; // ou une autre image du dossier public
                    }}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.username ?? 'Chargement...'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{primaryRole?.toLowerCase()}</p>
                  </div>
               </div>
               <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                  <LogOut className="mr-3 h-5 w-5" /> Déconnexion
               </button>
             </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Header */}
        <header className="flex h-14 items-center justify-between bg-white dark:bg-slate-900 px-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200">
          <button
            type="button"
            className="text-slate-500 dark:text-slate-400 lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs / Context - Left */}
          <div className="hidden lg:flex items-center text-sm text-slate-500 dark:text-slate-400">
             <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">Workspace</span>
             <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
             <span className="font-medium text-slate-900 dark:text-white capitalize">
                {location.pathname === '/' ? 'Tableau de bord' : location.pathname.replace('/', '')}
             </span>
          </div>

          {/* Actions - Right */}
          <div className="flex items-center space-x-3 ml-auto">
             <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
             
             {/* Theme Toggle Button */}
             <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
             >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
             </button>

             <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors">
               <Bell className="h-5 w-5" />
               <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900"></span>
             </button>
          </div>
        </header>

        {/* Page Scroll Area */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 lg:bg-slate-50/50 lg:dark:bg-slate-950">
           <Outlet />
        </main>
      </div>
    </div>
  );
};
