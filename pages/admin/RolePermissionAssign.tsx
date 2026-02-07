import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AdminRole, AdminPermission } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Check } from 'lucide-react';

export const RolePermissionAssign: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [r, p] = await Promise.all([api.getRoles(), api.getPermissions()]);
      setRoles(r);
      setPermissions(p);
      if (r.length > 0) setSelectedRoleId(r[0].id);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Fetch permissions for selected role
  useEffect(() => {
    if (selectedRoleId) {
        const fetchRolePerms = async () => {
            const perms = await api.getRolePermissions(selectedRoleId);
            setSelectedPermissions(new Set(perms));
        };
        fetchRolePerms();
    }
  }, [selectedRoleId]);

  const handleTogglePermission = (permId: string) => {
      const newSet = new Set(selectedPermissions);
      if (newSet.has(permId)) {
          newSet.delete(permId);
      } else {
          newSet.add(permId);
      }
      setSelectedPermissions(newSet);
  };

  const handleSave = async () => {
      if (!selectedRoleId) return;
      setSaving(true);
      await api.updateRolePermissions(selectedRoleId, Array.from(selectedPermissions));
      setSaving(false);
      // Optional toast feedback here
      alert("Permissions mises à jour avec succès.");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
         <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/settings')} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Assignation Rôles / Permissions</h1>
         </div>
         <div className="flex items-center gap-3">
             <button 
                onClick={handleSave}
                disabled={saving || !selectedRoleId}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
             >
                 {saving ? 'Enregistrement...' : <><Save className="h-4 w-4" /> Enregistrer les changements</>}
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
         {/* Sidebar: Role Selection */}
         <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Rôles disponibles</h3>
             <div className="space-y-1">
                 {roles.map(role => (
                     <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            selectedRoleId === role.id 
                            ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                            : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'
                        }`}
                     >
                         <Shield className="h-4 w-4 mr-2" />
                         {role.name}
                     </button>
                 ))}
             </div>
         </div>

         {/* Main: Permission Matrix */}
         <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
             {loading ? (
                 <div className="flex justify-center p-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 dark:border-slate-400"></div>
                 </div>
             ) : (
                 <div className="max-w-3xl">
                     <div className="mb-6">
                        <h2 className="text-lg font-medium text-slate-900 dark:text-white">Permissions pour : <span className="text-brand-600">{roles.find(r => r.id === selectedRoleId)?.name}</span></h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Cochez les permissions que vous souhaitez accorder à ce rôle.</p>
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                         {permissions.map(perm => {
                             const isSelected = selectedPermissions.has(perm.id);
                             return (
                                 <div 
                                    key={perm.id}
                                    onClick={() => handleTogglePermission(perm.id)}
                                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                                        isSelected 
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 dark:border-brand-500/50' 
                                        : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
                                    }`}
                                 >
                                     <div className="min-w-0 flex-1 text-sm">
                                         <label className={`font-medium ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-white'}`}>
                                             {perm.name}
                                         </label>
                                     </div>
                                     <div className="ml-3 flex h-5 items-center">
                                         <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                             isSelected 
                                             ? 'bg-brand-600 border-brand-600 text-white' 
                                             : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                         }`}>
                                             {isSelected && <Check className="h-3.5 w-3.5" />}
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};