import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { api } from '@/services/api';

export const IncidentAttachments: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || files.length === 0) return;

    setLoading(true);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });

    const res = await api.updateIncidentAttachments(id, formData);

    setLoading(false);

    if (!res.ok) {
      alert("Erreur lors de l’upload des fichiers");
      return;
    }

    navigate(`/incidents/${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
         <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(`/incidents/${id}`)} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Ajouter des pièces jointes</h1>
         </div>
       </div>

       <div className="flex-1 p-6 lg:p-10 max-w-2xl mx-auto w-full">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                          Sélectionner les fichiers à ajouter à l'incident
                      </label>
                      <div className="mt-1 flex justify-center border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                         <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer w-full h-full py-10 px-6 flex flex-col items-center justify-center text-center focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500 rounded-md"
                         >
                            <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                            <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center mt-4">
                              <span className="font-medium text-brand-600 hover:text-brand-500">
                                  Sélectionner des fichiers
                              </span>
                              <p className="pl-1">ou glisser-déposer</p>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              Tous types de fichiers acceptés
                            </p>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                         </label>
                      </div>
                      {files.length > 0 && (
                          <div className="mt-4">
                              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Fichiers sélectionnés</h4>
                              <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                 {files.map((file, index) => (
                                     <li key={index} className="flex items-center justify-between py-2 pl-3 pr-4 text-sm">
                                         <span className="truncate font-medium text-slate-900 dark:text-white">{file.name}</span>
                                         <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                     </li>
                                 ))}
                              </ul>
                          </div>
                      )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <button 
                        type="button" 
                        onClick={() => navigate(`/incidents/${id}`)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                     >
                         Annuler
                     </button>
                     <button 
                        type="submit" 
                        disabled={loading || files.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                     >
                         {loading ? 'Envoi...' : <><Save className="h-4 w-4" /> Confirmer l'ajout</>}
                     </button>
                </div>
            </form>
       </div>
    </div>
  );
};