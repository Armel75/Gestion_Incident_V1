import { adminSetUserPassword } from '../../services/api';
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
    // État pour le modal de changement de mot de passe admin
    const [modalUser, setModalUser] = useState<User | null>(null);
    const [modalPassword, setModalPassword] = useState('');
    const [modalPassword2, setModalPassword2] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const fetchData = async (pageNum: number) => {
    try {
      setLoading(true);
      const skip = (pageNum - 1) * pageSize;
      const [usersRes, rolesRes] = await Promise.all([
        api.getUsers(skip, pageSize),
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
    fetchData(page);
  };

  // Filtrage local sur toutes les colonnes visibles
  const filteredUsers = users.filter(user => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    // username, id, roles, site, statut
    const roles = user.roles?.map(r => r.name).join(' ') || '';
    const site = user.site?.name || '';
    const statut = user.isActive ? 'actif' : 'inactif';
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      String(user.id).includes(searchLower) ||
      roles.toLowerCase().includes(searchLower) ||
      site.toLowerCase().includes(searchLower) ||
      statut.includes(searchLower)
    );
  });

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
        {/* Champ de recherche */}
        <div className="mb-4 max-w-5xl mx-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur (toutes colonnes)"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-brand-500 dark:bg-slate-800 dark:text-white"
          />
        </div>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
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
                            {user.roles.map((role, idx) => (
                              <span
                                key={role.id ? `${user.id}-${role.id}` : `${user.id}-role-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                                {role.name}
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

                          <button
                            onClick={() => {
                              setModalUser(user);
                              setModalPassword('');
                              setModalPassword2('');
                              setModalError('');
                              setModalLoading(false);
                            }}
                            className="px-3 py-1.5 text-xs border border-yellow-300 text-yellow-700 rounded flex items-center gap-1"
                          >
                            🔑 Changer mot de passe
                          </button>
                        </div>
                            {/* Modal changement mot de passe admin */}
                            {modalUser && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 w-full max-w-sm relative">
                                  <button
                                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    onClick={() => setModalUser(null)}
                                    disabled={modalLoading}
                                  >✕</button>
                                  <h2 className="text-lg font-semibold mb-4">Changer le mot de passe de <span className="text-brand-600">{modalUser.username}</span></h2>
                                  <div className="mb-3">
                                    <input
                                      type="password"
                                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-brand-500 dark:bg-slate-800 dark:text-white"
                                      placeholder="Nouveau mot de passe"
                                      value={modalPassword}
                                      onChange={e => setModalPassword(e.target.value)}
                                      disabled={modalLoading}
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <input
                                      type="password"
                                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-brand-500 dark:bg-slate-800 dark:text-white"
                                      placeholder="Confirmer le mot de passe"
                                      value={modalPassword2}
                                      onChange={e => setModalPassword2(e.target.value)}
                                      disabled={modalLoading}
                                    />
                                  </div>
                                  {modalError && <div className="mb-3 text-red-600 text-sm">{modalError}</div>}
                                  <button
                                    className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded font-semibold disabled:opacity-60"
                                    disabled={modalLoading}
                                    onClick={async () => {
                                      setModalError('');
                                      if (!modalPassword || !modalPassword2) {
                                        setModalError('Veuillez remplir les deux champs.');
                                        return;
                                      }
                                      if (modalPassword.length < 6) {
                                        setModalError('Le mot de passe doit faire au moins 6 caractères.');
                                        return;
                                      }
                                      if (modalPassword !== modalPassword2) {
                                        setModalError('Les mots de passe ne correspondent pas.');
                                        return;
                                      }
                                      setModalLoading(true);
                                      try {
                                        await adminSetUserPassword(modalUser.id, modalPassword);
                                        setModalUser(null);
                                        setModalPassword('');
                                        setModalPassword2('');
                                        setModalError('');
                                        alert('Mot de passe changé avec succès.');
                                      } catch (err: any) {
                                        setModalError(err.message || 'Erreur lors du changement de mot de passe.');
                                      } finally {
                                        setModalLoading(false);
                                      }
                                    }}
                                  >
                                    {modalLoading ? 'Changement...' : 'Valider'}
                                  </button>
                                </div>
                              </div>
                            )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 py-4">
        <button
          className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Précédent
        </button>
        <span className="text-xs">Page {page}</span>
        <button
          className="px-3 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs"
          onClick={() => setPage((p) => p + 1)}
          disabled={users.length < pageSize}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};
