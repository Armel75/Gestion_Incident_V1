import React from 'react';
import { Layers, FileText, MapPin, Globe, ChevronRight, Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  const items = [
    { title: 'Catégorie', description: 'Gérer les catégories d’incidents', icon: Layers },
    { title: 'Processus', description: 'Gérer les processus métier', icon: FileText },
    { title: 'Site', description: 'Gérer les sites et localisations', icon: MapPin },
    { title: 'Type de site', description: 'Gérer les types de sites', icon: Globe },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
         <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <SettingsIcon className="h-6 w-6" />
         </div>
         <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Administration générale</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {items.map((item) => (
          <div 
            key={item.title}
            className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 cursor-pointer transition-all shadow-sm hover:shadow-md"
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