import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Incident, Task, UserRole } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { ArrowLeft, Calendar, User as UserIcon, CheckSquare, Plus, AlertTriangle, MoreHorizontal, Link as LinkIcon, Clock } from 'lucide-react';

export const IncidentDetail: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const inc = await api.getIncidentById(id);
        const taskList = await api.getTasks(id);
        setIncident(inc);
        setTasks(taskList);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div></div>;
  if (!incident) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Incident non trouvé</div>;

  const PropertyRow = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
      <div className="flex items-start py-2 group">
          <div className="w-32 flex-shrink-0 flex items-center text-xs text-slate-500 dark:text-slate-400">
             {Icon && <Icon className="h-3.5 w-3.5 mr-2 text-slate-400 dark:text-slate-500" />}
             {label}
          </div>
          <div className="flex-1 text-sm text-slate-900 dark:text-slate-200 font-medium break-words">
              {value}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 lg:bg-slate-50/50 lg:dark:bg-slate-950 transition-colors duration-200">
      
      {/* Top Bar - Actions and Context */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate('/incidents')} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center text-sm">
                <span className="font-mono text-slate-500 dark:text-slate-400 mr-3">{incident.reference}</span>
                <span className="text-slate-300 dark:text-slate-700 mr-3">|</span>
                <StatusBadge status={incident.status} />
            </div>
         </div>
         <div className="flex items-center gap-2">
            {userRole === 'ARBITRE' && incident.status !== 'CLOSED' && (
                <button className="text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 transition-colors">
                    <AlertTriangle className="h-3.5 w-3.5" /> Forcer Clôture
                </button>
            )}
            <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                <MoreHorizontal className="h-4 w-4" />
            </button>
            <button className="ml-2 bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors">
                Action Principale
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Main Content (8 cols) */}
            <div className="lg:col-span-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight mb-6">{incident.title}</h1>
                
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-6">
                    <button 
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Description & Tâches
                    </button>
                    <button 
                        onClick={() => setActiveTab('activity')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        Activité <span className="ml-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">3</span>
                    </button>
                </div>

                {activeTab === 'details' ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Description */}
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Description</h3>
                            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                {incident.description}
                            </div>
                        </div>

                        {/* Attachments */}
                        <div>
                           <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Pièces jointes</h3>
                           <div className="flex gap-3">
                                <div className="group flex items-center gap-3 p-2 pr-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer bg-white dark:bg-slate-900 transition-all">
                                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">PNG</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">error_log.png</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">240 KB</p>
                                    </div>
                                </div>
                           </div>
                        </div>

                        {/* Tasks */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Sous-tâches</h3>
                                <button className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Ajouter
                                </button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                {tasks.map((task, idx) => (
                                    <div key={task.id} className={`flex items-center p-3 gap-3 bg-white dark:bg-slate-900 ${idx !== tasks.length -1 ? 'border-b border-slate-100 dark:border-slate-800' : ''} hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group`}>
                                        <button className={`flex-shrink-0 h-4 w-4 rounded border ${task.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'} flex items-center justify-center transition-all`}>
                                            <CheckSquare className="h-3 w-3 fill-current" />
                                        </button>
                                        <span className={`text-sm flex-1 ${task.status === 'DONE' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{task.title}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <img src={`https://ui-avatars.com/api/?name=${task.assignedTo}&background=random&size=20`} className="h-5 w-5 rounded-full" alt="" />
                                            <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-600 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 border-dashed">
                        Zone d'activité et commentaires (Placeholder)
                    </div>
                )}
            </div>

            {/* Right Column: Properties Sidebar (4 cols) - Sticky */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent rounded-lg p-4 lg:p-0 border lg:border-0 border-slate-200 dark:border-slate-800 shadow-sm lg:shadow-none">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Propriétés</h3>
                    
                    <div className="space-y-1">
                        <PropertyRow label="Statut" value={<StatusBadge status={incident.status} />} />
                        <PropertyRow label="Priorité" value={<PriorityBadge priority={incident.priority} />} />
                        <PropertyRow label="Assigné à" value={
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                    {incident.assignedTo?.username?.substring(0,1)}
                                </div>
                                <span>{incident.assignedTo?.username || 'Unassigned'}</span>
                            </div>
                        } icon={UserIcon} />
                        <PropertyRow label="Service" value={<span className="inline-block bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{incident.service}</span>} />
                        <PropertyRow label="Échéance" value={new Date(incident.dueDate).toLocaleDateString()} icon={Calendar} />
                        <PropertyRow label="Créé le" value={new Date(incident.createdAt).toLocaleDateString()} icon={Clock} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent rounded-lg p-4 lg:p-0 border lg:border-0 border-slate-200 dark:border-slate-800 shadow-sm lg:shadow-none">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Contexte</h3>
                     <div className="space-y-1">
                        <PropertyRow label="Site" value={incident.site} />
                        <PropertyRow label="Catégorie" value={incident.category} />
                        <PropertyRow label="Lien Externe" value={<a href="#" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">JIRA-402 <LinkIcon className="h-3 w-3"/></a>} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};