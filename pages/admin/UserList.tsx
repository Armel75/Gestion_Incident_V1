import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  User as UserIcon
} from 'lucide-react';

import { api } from '../../services/api';
import { User, Role } from '../../types';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.getUsers(),
        api.getRoles()
      ]);
      setUsers(usersRes);
      setRoles(rolesRes);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!window.confirm(`Supprimer l'utilisateur "${username}" ?`)) return;
    await api.deleteUser(id);
    fetchData();
  };

  const getRoleName = (roleId: number): string => {
    return roles.find(r => r.id === roleId)?.name ?? 'N/A';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Gestion des utilisateurs
          </h1>
        </div>

        <button
          onClick={() => navigate('/settings/users/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-800 dark:border-slate-300" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y">
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm">
                      Aucun utilisateur configuré
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-slate-400">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {user.roles && user.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                            {user.roles.map(role => (
                                <span
                                key={role}
                                className="
                                    inline-flex items-center gap-1.5
                                    rounded-full px-2.5 py-0.5
                                    text-xs font-medium
                                    bg-indigo-100 text-indigo-800
                                    dark:bg-indigo-900/30 dark:text-indigo-300
                                "
                                >
                                {/* petit point décoratif */}
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                                {role}
                                </span>
                            ))}
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 italic">
                            Aucun rôle
                            </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.site ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            {user.site.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Aucun site
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.isActive ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="h-4 w-4" />
                            Actif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <XCircle className="h-4 w-4" />
                            Inactif
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/settings/users/${user.id}/edit`)
                            }
                            className="px-3 py-1.5 text-xs border rounded flex items-center gap-1"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Modifier
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(user.id, user.username)
                            }
                            className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
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
