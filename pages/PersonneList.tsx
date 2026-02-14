import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';

type Personne = {
  id: number;
  fullname: string;
};

export const PersonneList: React.FC = () => {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonnes();
  }, []);

  const fetchPersonnes = async () => {
    setLoading(true);
    const data = await api.getPersonnes();
    setPersonnes(data);
    setLoading(false);
  };

  const handleDelete = async (id: number, fullname: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la personne "${fullname}" ?`)) {
      await api.deletePersonne(id);
      fetchPersonnes();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Gestion des Personnes
          </h1>
        </div>

        <div>
          <button
            onClick={() => navigate('/settings/personnes/new')}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nouvelle personne
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm max-w-4xl mx-auto">
            
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-48">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {personnes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      Aucune personne configurée.
                    </td>
                  </tr>
                ) : (
                  personnes.map((personne) => (
                    <tr
                      key={personne.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {personne.fullname}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">

                          <button
                            onClick={() => navigate(`/settings/personnes/${personne.id}/edit`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Modifier
                          </button>

                          <button
                            onClick={() => handleDelete(personne.id, personne.fullname)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
};
