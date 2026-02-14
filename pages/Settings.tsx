import React from 'react';
import { Layers, FileText, MapPin, Globe, ChevronRight, Settings as SettingsIcon, GitMerge, FileStack, Shield, Users, Lock, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const businessItems = [
    { title: 'Catégorie', description: 'Gérer les catégories d’incidents', icon: Layers, path: '/settings/categories' },
    { title: 'Sous-catégorie', description: 'Gérer les sous-catégories', icon: GitMerge, path: '/settings/sub-categories' },
    { title: 'Processus', description: 'Gérer les processus métier', icon: FileText, path: '/settings/processes' },
    { title: 'Sous-processus', description: 'Gérer les sous-processus', icon: FileStack, path: '/settings/sub-processes' },
    { title: 'Site', description: 'Gérer les sites et localisations', icon: MapPin, path: '/settings/sites' },
    { title: 'Type de site', description: 'Gérer les types de sites', icon: Globe, path: '#' },
  ];

  const adminItems = [
      { title: 'Utilisateurs', description: 'Gérer les comptes utilisateurs', icon: Users, path: '/settings/users' },
      { title: 'Personnes', description: 'Gérer les fiches personnes', icon: Users, path: '/settings/personnes' },
      { title: 'Rôles', description: 'Définir les rôles applicatifs', icon: Shield, path: '/settings/roles' },
      { title: 'Permissions', description: 'Liste des droits d\'accès', icon: Key, path: '/settings/permissions' },
      { title: 'Assignation', description: 'Lier permissions et rôles', icon: Lock, path: '/settings/assignment' },
   ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
         <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <SettingsIcon className="h-6 w-6" />
         </div>
         <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Administration générale de l'application</p>
         </div>
      </div>

      <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Référentiel Métier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessItems.map((item) => (
              <div
                key={item.title}
                onClick={() => navigate(item.path)}
                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm hover:shadow-md hover:border-brand-500 dark:hover:border-brand-500 cursor-pointer"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            ))}
          </div>
      </div>

      <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Sécurité & Accès</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            { adminItems.map((item) => (
              <div
                key={item.title}
                onClick={() => navigate(item.path)}
                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {adminItems.map((item) => (
          <div 
            key={item.title}
            onClick={() => item.path !== '#' && navigate(item.path)}
            className={`group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all shadow-sm hover:shadow-md ${item.path !== '#' ? 'hover:border-brand-500 dark:hover:border-brand-500 cursor-pointer' : 'opacity-75 cursor-default'}`}
          >
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors">
              <item.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.description}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};