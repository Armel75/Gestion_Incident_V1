import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';

export const NewTask: React.FC = () => {
  const { incidentId, taskId } = useParams<{ incidentId: string; taskId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!taskId;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    attachments: [] as File[]
  });

  useEffect(() => {
    if (isEditMode && taskId) {
        const fetchTask = async () => {
            const task = await api.getTaskById(taskId);
            if (task) {
                setFormData(prev => ({
                    ...prev,
                    name: task.name,
                    description: task.description || ''
                }));
            }
        };
        fetchTask();
    }
  }, [taskId, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(e.target.files || [])]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId) return;

    setLoading(true);

    try {
      const data = new FormData();

      // ✅ champs métier
      data.append('name', formData.name ?? '');
      data.append('description', formData.description ?? '');

      // ✅ relation obligatoire (string numérique)
      data.append('incidentId', String(incidentId));

      // ✅ pièces jointes
      formData.attachments.forEach(file => {
        data.append('attachments', file);
      });

      if (isEditMode && taskId) {
        await api.updateTask(taskId, data);
      } else {
        await api.createTask(data);
      }

      navigate(`/incidents/${incidentId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200" encType="multipart/form-data">
       {/* Top Bar */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
         <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(`/incidents/${incidentId}`)} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{isEditMode ? 'Modifier la Tâche' : 'Nouvelle Tâche'}</h1>
         </div>
         <div className="flex items-center gap-3">
             <button 
                type="button" 
                onClick={() => navigate(`/incidents/${incidentId}`)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
             >
                 Annuler
             </button>
             <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
             >
                 {loading ? 'Enregistrement...' : <><Save className="h-4 w-4" /> {isEditMode ? 'Modifier' : 'Enregistrer'}</>}
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-2xl mx-auto w-full space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
              <div className="space-y-6">
                  <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titre <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        id="name"
                        name="name" 
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Action à réaliser"
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      />
                  </div>
                  <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea 
                        id="description"
                        name="description" 
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Détails supplémentaires..."
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pièces jointes</label>
                      <label
                        htmlFor="task-file-upload"
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer w-full block"
                      >
                        <div className="space-y-1 text-center w-full">
                          <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                          <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                            <span className="relative rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500">
                              <span>Sélectionner des fichiers</span>
                            </span>
                            <p className="pl-1">ou glisser-déposer</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            PNG, JPG, PDF, DOCX up to 10MB
                          </p>
                          <input id="task-file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                        </div>
                      </label>
                      {formData.attachments.length > 0 && (
                          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                             {formData.attachments.map((file, index) => (
                                 <li key={index} className="flex items-center justify-between py-2 pl-3 pr-4 text-sm">
                                     <div className="flex w-0 flex-1 items-center">
                                         <span className="truncate font-medium text-slate-900 dark:text-white">{file.name}</span>
                                     </div>
                                 </li>
                             ))}
                          </ul>
                      )}
                  </div>
              </div>
          </section>
      </div>
    </form>
  );
};