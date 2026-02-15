import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { IncidentStats } from '../types';
import { KPICard, Card } from '../components/ui/Card';
import { AlertCircle, Clock, CheckCircle2, Ban } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<IncidentStats>({
    open: 0,
    inProgress: 0,
    closed: 0,
    cancelled: 0,
    byService: [],
    byStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getSimpleStats();

        setStats(prev => ({
          ...prev,
          ...data,
          byService: [
            { name: 'IT', value: data.inProgress },
            { name: 'Contrôle gestion', value: data.inProgress },
            { name: 'Comptabilité', value: data.inProgress },
            { name: 'Fiscalité', value: data.inProgress },
            { name: 'Audit et contrôle', value: data.inProgress },
            { name: 'Technique', value: data.inProgress },
            { name: 'Juridique', value: data.inProgress },
            { name: 'Exploitation', value: data.inProgress },
            { name: 'Commercial', value: data.inProgress },
            { name: 'Marketing', value: data.inProgress },
            { name: 'Logistique', value: data.inProgress },
          ], // vide pour l'instant
        byStatus: [
          { name: 'Ouverts', value: data.open },
          { name: 'En cours', value: data.inProgress },
          { name: 'Résolus', value: data.closed },
          { name: 'Annulés', value: data.cancelled },
        ],
        }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !stats) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800 dark:border-slate-400"></div></div>;
  }

  // Linear-like palette
  const PALETTE = ['#3b82f6', '#94a3b8', '#10b981', '#ef4444', '#f59e0b'];
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const handleCardClick = (statusFilter: string) => {
    navigate(`/incidents?status=${statusFilter}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vue d'ensemble de l'activité du support.</p>
      </div>

      {/* KPIs - Using a tighter grid and making them clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => handleCardClick('OPEN')} className="cursor-pointer transform transition hover:-translate-y-1">
          <KPICard title="Incidents Ouverts" value={stats.open} icon={AlertCircle} trend="" />
        </div>
        <div onClick={() => handleCardClick('IN_PROGRESS')} className="cursor-pointer transform transition hover:-translate-y-1">
          <KPICard title="En Cours" value={stats.open} icon={Clock} />
        </div>
        <div onClick={() => handleCardClick('RESOLVED')} className="cursor-pointer transform transition hover:-translate-y-1">
          <KPICard title="Résolus (Mois)" value={stats.closed} icon={CheckCircle2} trend="" trendUp />
        </div>
        <div onClick={() => handleCardClick('CANCELLED')} className="cursor-pointer transform transition hover:-translate-y-1">
          <KPICard title="Annulé" value={stats.cancelled} icon={Ban} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1 - 2/3 width */}
        <Card title="Volume par Service" className="lg:col-span-2 min-h-[300px]">
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byService} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2 - 1/3 width */}
        <Card title="État des Incidents" className="min-h-[300px]">
          <div className="h-56 w-full relative mt-4">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ ...tooltipStyle, border: 'none' }}/>
              </PieChart>
             </ResponsiveContainer>
             {/* Center Label */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-center">
                     <span className="block text-2xl font-bold text-slate-900 dark:text-white">{stats.open + stats.inProgress}</span>
                     <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-medium">Actifs</span>
                 </div>
             </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 px-2">
              {stats.byStatus.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: PALETTE[index % PALETTE.length] }}></span>
                      {entry.name}
                  </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};