import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Task } from '../types';
import { CheckSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const data = await api.getAllTasks();
      setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Mes Tâches</h1>
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/10">
                Total: {tasks.length}
            </span>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 p-6">
        {loading ? (
             <div className="flex flex-col items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Chargement des tâches...</p>
             </div>
        ) : (
          tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  <p>Aucune tâche trouvée.</p>
              </div>
          ) : (
             <div className="grid gap-4 max-w-5xl mx-auto">
                 {tasks.map((task) => (
                     <div key={task.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm">
                         <div className="flex items-start gap-4">
                             <div className={`mt-1 flex-shrink-0 h-5 w-5 rounded border ${task.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'} flex items-center justify-center`}>
                                 <CheckSquare className="h-3.5 w-3.5 fill-current" />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex items-center justify-between">
                                     <h3 className={`text-sm font-medium ${task.status === 'DONE' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                         {task.title}
                                     </h3>
                                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                         task.status === 'DONE' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                         task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                     }`}>
                                         {task.status === 'OPEN' ? 'À faire' : task.status === 'IN_PROGRESS' ? 'En cours' : 'Terminé'}
                                     </span>
                                 </div>
                                 {task.description && (
                                     <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                         {task.description}
                                     </p>
                                 )}
                                 <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                                     <div className="flex items-center gap-1.5">
                                         <Calendar className="h-3.5 w-3.5" />
                                         {/* {new Date(task.dueDate).toLocaleDateString()} */}
                                     </div>
                                     <div className="flex items-center gap-1.5">
                                         <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                         Assigné à: {task.assignedTo}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
          )
        )}
      </div>
      
      {/* Footer Pagination */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
         <span className="text-xs text-slate-500 dark:text-slate-400">
            Total <span className="font-medium text-slate-900 dark:text-white">{tasks.length}</span> tâches
         </span>
         <div className="flex items-center gap-1">
            <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                <ChevronRight className="h-4 w-4" />
            </button>
         </div>
      </div>
    </div>
  );
};