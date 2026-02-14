import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export const NewPersonne: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    fullname: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      const fetchPersonne = async () => {
        const personne = await api.getPersonneById(id);
        if (personne) {
          setFormData({
            fullname: personne.fullname || ''
          });
        }
      };
      fetchPersonne();
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && id) {
        await api.updatePersonne(id, { fullname: formData.fullname });
      } else {
        await api.createPersonne({ fullname: formData.fullname });
      }
      navigate('/settings/personnes');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/settings/personnes')}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditMode ? 'Modifier la Personne' : 'Nouvelle Personne'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings/personnes')}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : (
              <>
                <Save className="h-4 w-4" />
                {isEditMode ? 'Modifier' : 'Enregistrer'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-2xl mx-auto w-full">
        <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
          <div className="space-y-6">

            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                required
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Ex: Jean Dupont"
                className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
              />
            </div>

          </div>
        </section>
      </div>
    </form>
  );
};
