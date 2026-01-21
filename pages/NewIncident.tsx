import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save, Paperclip } from 'lucide-react';
import { Incident, Priority } from '../types';
import { MultiSelect } from '../components/ui/MultiSelect';

// Mock Data for Dropdowns
const SITES = ['Paris La Défense', 'Lyon Entrepôt', 'Bordeaux Siège', 'Nantes Agence', 'Remote / Télétravail'];
const CATEGORIES = ['Matériel / Hardware', 'Logiciel / Software', 'Réseau / Network', 'Bâtiment', 'Sécurité'];
const SUB_CATEGORIES = {
    'Matériel / Hardware': ['Ordinateur', 'Imprimante', 'Serveur', 'Périphérique', 'Autre'],
    'Logiciel / Software': ['OS', 'Suite Office', 'ERP', 'SaaS', 'Autre'],
    'Réseau / Network': ['Wifi', 'VPN', 'LAN', 'Internet', 'Autre'],
    'Bâtiment': ['Electricité', 'Plomberie', 'Accès', 'Climatisation', 'Autre'],
    'Sécurité': ['Virus', 'Phishing', 'Droit d\'accès', 'Autre']
};
const PROCESS_DOMAINS = ['Ventes', 'Achats', 'Logistique', 'Finance', 'RH', 'IT'];
const KEY_PROCESSES = ['Commande Client', 'Facturation', 'Expédition', 'Paie', 'Onboarding', 'Backup'];
const SERVICES = ['IT Infrastructure', 'IT Support', 'Logistique', 'Finance', 'RH', 'Services Généraux'];
const CRITICALITY = ['Faible', 'Moyenne', 'Haute', 'Critique'];
const URGENCY = ['Faible', 'Moyenne', 'Haute', 'Immédiate'];

// Simple mock for Users per service
const USERS_BY_SERVICE: Record<string, string[]> = {
    'IT Infrastructure': ['Thomas Anderson', 'Trinity'],
    'IT Support': ['Jean Dupont', 'Alice Wonderland'],
    'Logistique': ['Bob Builder'],
    'Finance': ['Picsou'],
    'RH': ['Happy Hogan'],
    'Services Généraux': ['Alfred Pennyworth']
};

export const NewIncident: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    site: [] as string[],
    scope: '',
    category: '',
    subCategory: '',
    otherSubCategory: '',
    processDomain: '',
    keyProcess: '',
    subProcess: '',
    description: '',
    impactedService: '',
    criticality: 'Moyenne',
    urgency: 'Moyenne',
    responsibleServices: [] as string[],
    assignedUsers: [] as string[],
    dueDate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (field: string, values: string[]) => {
      setFormData(prev => ({ ...prev, [field]: values }));
      
      // Clear assigned users if responsible services change and selected users are no longer valid
      // (Simplified logic here: just keep them, or clear them if services become empty)
      if (field === 'responsibleServices' && values.length === 0) {
          setFormData(prev => ({ ...prev, [field]: values, assignedUsers: [] }));
      }
  };

  const mapUrgencyToPriority = (urgency: string): Priority => {
      switch(urgency) {
          case 'Immédiate': return 'CRITICAL';
          case 'Haute': return 'HIGH';
          case 'Faible': return 'LOW';
          default: return 'MEDIUM';
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.site.length === 0) {
        alert("Veuillez sélectionner au moins un site.");
        return;
    }
    if (formData.responsibleServices.length === 0) {
        alert("Veuillez sélectionner au moins un service responsable.");
        return;
    }

    setLoading(true);

    // Basic mapping to Incident Type
    const incidentPayload: Partial<Incident> = {
        title: `${formData.category} - ${formData.scope || 'Incident'}`, 
        site: formData.site.join(', '), // Joining array for string display in current model
        category: formData.subCategory === 'Autre' ? formData.otherSubCategory : formData.subCategory || formData.category,
        service: formData.impactedService,
        description: formData.description,
        priority: mapUrgencyToPriority(formData.urgency),
        dueDate: formData.dueDate
    };

    try {
        await api.createIncident(incidentPayload);
        navigate('/incidents');
    } catch (error) {
        console.error(error);
        setLoading(false);
    }
  };

  const availableSubCategories = formData.category ? (SUB_CATEGORIES as any)[formData.category] || [] : [];
  
  // Dynamically calculate available users based on ALL selected responsible services
  const availableUsers = useMemo(() => {
    let users: string[] = [];
    formData.responsibleServices.forEach(service => {
        if (USERS_BY_SERVICE[service]) {
            users = [...users, ...USERS_BY_SERVICE[service]];
        }
    });
    // Remove duplicates
    return Array.from(new Set(users));
  }, [formData.responsibleServices]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
       {/* Top Bar */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
         <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/incidents')} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Nouvel Incident</h1>
         </div>
         <div className="flex items-center gap-3">
             <button 
                type="button" 
                onClick={() => navigate('/incidents')}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
             >
                 Annuler
             </button>
             <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
             >
                 {loading ? 'Enregistrement...' : <><Save className="h-4 w-4" /> Enregistrer</>}
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">
          
          {/* Section 1: Localisation / Portée */}
          <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                  1. Localisation / Portée
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <MultiSelect 
                        label="Site concerné"
                        required
                        options={SITES}
                        selected={formData.site}
                        onChange={(vals) => handleMultiSelectChange('site', vals)}
                        placeholder="Choisir un ou plusieurs sites..."
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Périmètre de l'incident</label>
                      <input 
                        type="text" 
                        name="scope" 
                        value={formData.scope}
                        onChange={handleChange}
                        placeholder="Ex: Salle 304, Application Web, Ligne de production A"
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      />
                  </div>
              </div>
          </section>

          {/* Section 2: Qualification Métier */}
          <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                  2. Qualification Métier
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie principale <span className="text-red-500">*</span></label>
                        <select 
                            name="category" 
                            required 
                            value={formData.category} 
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                        >
                            <option value="">Sélectionner...</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sous-catégorie</label>
                        <select 
                            name="subCategory" 
                            disabled={!formData.category}
                            value={formData.subCategory} 
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6 disabled:opacity-50"
                        >
                            <option value="">Sélectionner...</option>
                            {availableSubCategories.map((sc: string) => <option key={sc} value={sc}>{sc}</option>)}
                        </select>
                    </div>
                  </div>

                  {formData.subCategory === 'Autre' && (
                       <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Précision (Sous-catégorie non listée)</label>
                          <input 
                            type="text" 
                            name="otherSubCategory"
                            value={formData.otherSubCategory}
                            onChange={handleChange}
                            className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                          />
                       </div>
                  )}

                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Domaine de processus</label>
                      <select 
                        name="processDomain" 
                        value={formData.processDomain} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      >
                          <option value="">Sélectionner...</option>
                          {PROCESS_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Processus clé impacté</label>
                      <select 
                        name="keyProcess" 
                        value={formData.keyProcess} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      >
                          <option value="">Sélectionner...</option>
                          {KEY_PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
                  <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sous-processus (Optionnel)</label>
                        <select 
                        name="subProcess" 
                        value={formData.subProcess} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      >
                          <option value="">N/A</option>
                          <option value="Example 1">Validation Manager</option>
                          <option value="Example 2">Saisie des écritures</option>
                      </select>
                  </div>
              </div>
          </section>

          {/* Section 3: Description */}
          <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                  3. Description
              </h2>
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description détaillée <span className="text-red-500">*</span></label>
                      <textarea 
                        name="description" 
                        required
                        rows={5}
                        value={formData.description}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                        placeholder="Décrivez l'incident, les symptômes observés, les messages d'erreur..."
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pièces jointes</label>
                      <div className="flex justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <div className="text-center">
                            <Paperclip className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                            <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400 justify-center">
                                <span className="relative cursor-pointer rounded-md bg-transparent font-semibold text-brand-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 hover:text-brand-500">
                                    <span>Upload a file</span>
                                </span>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-slate-500 dark:text-slate-500">PNG, JPG, PDF up to 10MB</p>
                        </div>
                      </div>
                  </div>
              </div>
          </section>

          {/* Section 4: Impact & Urgence */}
          <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                  4. Impact & Urgence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service impacté</label>
                      <select 
                        name="impactedService" 
                        value={formData.impactedService} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      >
                          <option value="">Sélectionner...</option>
                          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Criticité Métier</label>
                      <select 
                        name="criticality" 
                        value={formData.criticality} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      >
                          {CRITICALITY.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Urgence</label>
                      <select 
                        name="urgency" 
                        value={formData.urgency} 
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      >
                          {URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                  </div>
              </div>
          </section>

          {/* Section 5 & 6: Assignation & Délais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Section 5: Assignation */}
               <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                      5. Assignation
                  </h2>
                   <div className="space-y-6">
                      <div>
                          <MultiSelect
                            label="Service(s) responsable(s)"
                            required
                            options={SERVICES}
                            selected={formData.responsibleServices}
                            onChange={(vals) => handleMultiSelectChange('responsibleServices', vals)}
                            placeholder="Choisir les services..."
                          />
                      </div>
                       <div>
                          <MultiSelect
                             label="Utilisateur(s) assigné(s)"
                             options={availableUsers}
                             selected={formData.assignedUsers}
                             onChange={(vals) => handleMultiSelectChange('assignedUsers', vals)}
                             placeholder={formData.responsibleServices.length > 0 ? "Choisir les utilisateurs..." : "Sélectionner un service d'abord"}
                          />
                      </div>
                   </div>
               </section>

               {/* Section 6: Délais */}
               <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                      6. Délais
                  </h2>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date d'échéance souhaitée <span className="text-red-500">*</span></label>
                      <input 
                        type="date" 
                        name="dueDate" 
                        required
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      />
                  </div>
               </section>
          </div>

      </div>
    </form>
  );
};