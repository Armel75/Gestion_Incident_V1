import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, Save } from 'lucide-react';
import { CreateUserDTO, Role, Site } from '../../types';
import { SearchSelect } from '@/components/ui/SearchSelect';

export const NewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const isEditMode = !!id;
  const [formData, setFormData] = useState({
    username: '',
    roleIds: [] as number[], // ✅ tableau de nombres
    siteId: null as number | null, // 🔥 AJOUT
    isActive: true,
    password: ''
  });

  // useEffect(() => {
  //       const init = async () => {
  //       const availableRoles = await api.getRoles();
  //       const avalaibleSites = await api.getSites();
  //       setRoles(availableRoles);
  //       setSites(avalaibleSites);

  //       if (isEditMode && id) {
  //         const item = await api.getUserById(Number(id));
  //         if (item) {
  //           setFormData({
  //             username: item.username,
  //             roleIds: item.roles
  //               ? roles
  //                   .filter(r => item.roles.includes(r.name))
  //                   .map(r => r.id)
  //               : [],
  //             isActive: item.isActive,
  //             password: ''
  //           });
  //         }
  //       }
  //   };
  //   init();
  // }, [id, isEditMode]);

  useEffect(() => {
    const init = async () => {
      const availableRoles = await api.getRoles();

      // 🔥 récupération paginée
      const sitesResult = await api.getSites(1, 1000);

      setRoles(availableRoles);

      // 🔥 IMPORTANT : on prend .data
      setSites(sitesResult.data);

      if (isEditMode && id) {
        const item = await api.getUserById(Number(id));
        if (item) {
          setFormData({
            username: item.username,
            roleIds: item.roles
            ? item.roles.map(role => role.id)
            : [],
            siteId: item.siteId ?? null, // 🔥 IMPORTANT
            isActive: item.isActive,
            password: ''
          });
        }
      }
    };

    init();
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = {
          username: formData.username,
          roleIds: formData.roleIds, // ✅ CE QUE LE BACKEND ATTEND
          isActive: formData.isActive,
          ...(formData.password ? { password: formData.password } : {})
        };

        if (isEditMode && id) {

            const updatePayload = {
              username: formData.username,
              roleIds: formData.roleIds,
              isActive: formData.isActive,
              siteId: formData.siteId,
              ...(formData.password ? { password: formData.password } : {})
            };

             await api.updateUser(Number(id), updatePayload);
        } else {
             if (!formData.password) {
                throw new Error("Password is required");
              }

              const createPayload: CreateUserDTO = {
                username: formData.username,
                password: formData.password, // 🔥 obligatoire
                roleIds: formData.roleIds,
                isActive: formData.isActive,
                siteId: formData.siteId
              };

              // ✅ Validation UI : un non-admin doit avoir un site
              if (!isAdmin && !formData.siteId) {
                alert("Un utilisateur non admin doit appartenir à un site.");
                setLoading(false);
                return;
              }

              await api.createUser(createPayload);
        }
        navigate('/settings/users');
    } catch (error) {
        console.error(error);
        setLoading(false);
    }
  };

  const selectedRoleId = formData.roleIds[0];
  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isAdmin = selectedRole?.name === 'ADMIN';

  const canSubmit = isAdmin || !!formData.siteId;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
       <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
         <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/settings/users')} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{isEditMode ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}</h1>
         </div>
         <div className="flex items-center gap-3">
             <button 
                type="button" 
                onClick={() => navigate('/settings/users')}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
             >
                 Annuler
             </button>
             <button 
                type="submit"
                disabled={loading || !canSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
             >
                 {loading ? 'Enregistrement...' : <><Save className="h-4 w-4" /> {isEditMode ? 'Modifier' : 'Enregistrer'}</>}
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-2xl mx-auto w-full">
          <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
              <div className="space-y-6">
                  <div>
                      <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom d'utilisateur <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        id="username"
                        name="username" 
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      />
                  </div>
                  <div>
                      <label htmlFor="roleId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rôle <span className="text-red-500">*</span></label>
                      <select
                      id="roleIds"
                      name="roleIds"
                      value={formData.roleIds.length > 0 ? String(formData.roleIds[0]) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          roleIds: value ? [Number(value)] : []
                        }));
                      }}
                      className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white
                                ring-1 ring-inset ring-slate-300 dark:ring-slate-700
                                focus:ring-2 focus:ring-brand-600 dark:bg-slate-800
                                sm:text-sm sm:leading-6"
                    >
                      <option value="">Sélectionner un rôle...</option>
                      {roles.map(r => (
                        <option key={r.id} value={String(r.id)}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="Site" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site <span className="text-red-500">*</span></label>
                    <SearchSelect
                      options={sites.map(s => s.name)}
                      value={
                        sites.find(s => s.id === formData.siteId)?.name || ''
                      }
                      disabled={isAdmin}
                      onChange={(selectedName) => {
                        const selectedSite = sites.find(s => s.name === selectedName);

                        setFormData(prev => ({
                          ...prev,
                          siteId: selectedSite ? selectedSite.id : null
                        }));
                      }}
                      placeholder="Rechercher un site..."
                    />
                  </div>
                  <div>
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          {isEditMode ? 'Mot de passe (Laisser vide pour ne pas changer)' : 'Mot de passe'} { !isEditMode && <span className="text-red-500">*</span> }
                      </label>
                      <input 
                        type="password" 
                        id="password"
                        name="password" 
                        required={!isEditMode}
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                      />
                  </div>
                   <div className="relative flex items-start pt-2">
                    <div className="flex h-6 items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:ring-offset-slate-900"
                      />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                      <label htmlFor="isActive" className="font-medium text-slate-900 dark:text-white">Compte Actif</label>
                      <p className="text-slate-500 dark:text-slate-400">Si décoché, l'utilisateur ne pourra pas se connecter.</p>
                    </div>
                  </div>
              </div>
          </section>
      </div>
    </form>
  );
};