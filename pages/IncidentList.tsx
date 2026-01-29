import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Incident } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Search, ChevronLeft, ChevronRight, Plus, ArrowUpDown, XCircle, FileSpreadsheet, FileText, CheckCircle } from 'lucide-react';

const SERVICES_FILTER_OPTIONS = ['IT Infrastructure', 'IT Support', 'Logistique', 'Finance', 'RH', 'Services Généraux'];

export const IncidentList: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    const data = await api.getIncidents();
    setIncidents(data);
    setLoading(false);
  };

  const clearFilter = () => {
      setSearchParams({});
      setSearchTerm('');
      setServiceFilter('');
  };

  const filteredIncidents = useMemo(() => {
      return incidents.filter(incident => {
          // Status Filter
          if (statusFilter && incident.status !== statusFilter) {
              return false;
          }
          // Service Filter
          if (serviceFilter && incident.service !== serviceFilter) {
              return false;
          }
          // Text Search Filter
          if (searchTerm) {
              const term = searchTerm.toLowerCase();
              return (
                  incident.title.toLowerCase().includes(term) ||
                  incident.reference.toLowerCase().includes(term) ||
                  incident.description.toLowerCase().includes(term)
              );
          }
          return true;
      });
  }, [incidents, statusFilter, serviceFilter, searchTerm]);

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleExportExcel = (e: React.MouseEvent, incident: Incident) => {
      e.stopPropagation();
      const csvContent = [
          ['Reference', 'Title', 'Status', 'Priority', 'Service', 'Created At'],
          [incident.reference, incident.title, incident.status, incident.priority, incident.service, incident.createdAt]
      ].map(e => e.join(",")).join("\n");
      
      downloadFile(csvContent, `incident_${incident.reference}.csv`, 'text/csv');
  };

  const handleExportPDF = (e: React.MouseEvent, incident: Incident) => {
      e.stopPropagation();
      // Simulating PDF download with a dummy text file
      const dummyContent = `RAPPORT INCIDENT\n\nREF: ${incident.reference}\nTITRE: ${incident.title}\nSTATUT: ${incident.status}\n...`;
      downloadFile(dummyContent, `incident_${incident.reference}.pdf`, 'application/pdf');
      alert(`Export PDF simulé pour ${incident.reference}`);
  };

  const handleCloseIncident = async (e: React.MouseEvent, incident: Incident) => {
      e.stopPropagation();
      if (window.confirm(`Voulez-vous vraiment clôturer l'incident ${incident.reference} ?`)) {
          await api.updateIncident(incident.id, { status: 'CLOSED' });
          fetchIncidents(); // Refresh list
      }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Action Bar - Fixed height, integrated borders */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Incidents</h1>
            {(statusFilter || searchTerm || serviceFilter) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/50 px-2 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-700/10">
                    Filtres actifs
                    <button onClick={clearFilter} className="text-brand-600 hover:text-brand-900 dark:hover:text-white">
                        <XCircle className="h-3.5 w-3.5" />
                    </button>
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-48 lg:w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                />
             </div>
             
             <select
                 value={serviceFilter}
                 onChange={(e) => setServiceFilter(e.target.value)}
                 className="h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 hover:border-slate-300 dark:hover:border-slate-600"
             >
                 <option value="">Tous les services</option>
                 {SERVICES_FILTER_OPTIONS.map(service => (
                     <option key={service} value={service}>{service}</option>
                 ))}
             </select>

             <button
                className="h-8 pl-2 pr-3 bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white rounded-md text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all"
                onClick={() => navigate('/incidents/new')}
             >
                <Plus className="h-4 w-4" />
                Nouveau
             </button>
        </div>
      </div>

      {/* Table Container - Flex grow to fill space */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        {loading ? (
             <div className="flex flex-col items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Chargement des données...</p>
             </div>
        ) : (
          filteredIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                  <p>Aucun incident trouvé.</p>
                  {(statusFilter || searchTerm || serviceFilter) && <button onClick={clearFilter} className="mt-2 text-sm text-brand-600 hover:underline">Effacer les filtres</button>}
              </div>
          ) : (
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sujet</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">Statut</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-28">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">Priorité <ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Assigné</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[280px]">Actions Rapides</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
              {filteredIncidents.map((incident) => (
                <tr 
                    key={incident.id} 
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                >
                  <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {incident.reference}
                  </td>
                  <td className="px-6 py-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{incident.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1 md:hidden">
                        {new Date(incident.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                      <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                      <PriorityBadge priority={incident.priority} showLabel={false} />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {incident.service}
                      </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    {incident.assignedTo ? (
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-bold border border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                                {incident.assignedTo.username.substring(0,2).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300">{incident.assignedTo.username}</span>
                        </div>
                    ) : <span className="text-xs text-slate-400 italic">--</span>}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => handleExportPDF(e, incident)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                            title="Exporter en PDF"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF
                          </button>
                          <button 
                            onClick={(e) => handleExportExcel(e, incident)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/50"
                            title="Exporter en Excel"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                          </button>
                          {incident.status !== 'CLOSED' && incident.status !== 'CANCELLED' && (
                             <button 
                                onClick={(e) => handleCloseIncident(e, incident)}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                                title="Clôturer l'incident"
                             >
                                <CheckCircle className="h-3.5 w-3.5" /> Clôturer
                             </button>
                          )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )
        )}
      </div>

      {/* Footer Pagination - Minimalist */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
         <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-900 dark:text-white">{filteredIncidents.length}</span> items
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