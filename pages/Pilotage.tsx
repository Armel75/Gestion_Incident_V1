import React from 'react';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';

// Mock data strictly for Pilotage view
const MOCK_PILOTAGE_DATA = [
  { name: 'Jan', incidents: 65, resolus: 60 },
  { name: 'Fév', incidents: 59, resolus: 55 },
  { name: 'Mar', incidents: 80, resolus: 75 },
  { name: 'Avr', incidents: 81, resolus: 78 },
  { name: 'Mai', incidents: 56, resolus: 50 },
  { name: 'Juin', incidents: 55, resolus: 53 },
  { name: 'Juil', incidents: 40, resolus: 38 },
];

const MOCK_BY_SITE = [
    { name: 'Paris', value: 120 },
    { name: 'Lyon', value: 80 },
    { name: 'Bordeaux', value: 45 },
    { name: 'Nantes', value: 30 },
];

export const Pilotage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de Pilotage</h1>
        <p className="mt-2 text-sm text-slate-600">Vue directionnelle - Performance globale et tendances.</p>
      </div>

      {/* Global Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Incidents (YTD)</h3>
              <div className="mt-2 flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-white">436</span>
                 <span className="text-sm text-green-400 font-medium">-12% vs N-1</span>
              </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Délai Moyen Résolution (MTTR)</h3>
              <div className="mt-2 flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-slate-900">4.2h</span>
                 <span className="text-sm text-red-500 font-medium">+0.5h</span>
              </div>
          </div>
           <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Coût Est. Indisponibilité</h3>
              <div className="mt-2 flex items-baseline gap-2">
                 <span className="text-4xl font-bold text-slate-900">12k€</span>
              </div>
          </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Évolution annuelle des incidents">
             <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={MOCK_PILOTAGE_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Ouverts" />
                    <Line type="monotone" dataKey="resolus" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} name="Résolus" />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </Card>

          <Card title="Volume par Site (Top 4)">
             <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={MOCK_BY_SITE} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" fill="#64748b" radius={[0, 4, 4, 0]} barSize={32} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </Card>
      </div>
    </div>
  );
};