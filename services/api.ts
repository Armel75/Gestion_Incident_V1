import { Incident, IncidentStats, User, Task, Site, Category, SubCategory, Process, SubProcess, Permission, Role, RolePermission, UpdateUserDTO, CreateUserDTO } from '../types';
import { MOCK_DELAY } from '../constants';
import { IncidentAttachment } from '@/src/types/attachment';
import { AppJwtPayload } from '../src/types/auth/jwt.types';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const apiFetch = async (path: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('accessToken');

  const doFetch = async () => {
    const headers: HeadersInit = {
      Authorization: token ? `Bearer ${token}` : '',
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  };

  let response = await doFetch();

  // 🔥 Access token expiré → refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('Session expirée');
    }

    token = newToken;
    response = await doFetch(); // 🔁 rejoue la requête
  }

  return response;
};

interface JwtPayload {
  id: string | number;
  username: string;
  fullName: string;
  roles?: string[];
}

export function decodeJwt(token: string): JwtPayload {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
}


const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json();

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data.accessToken;
};

export const api = {

  login: async (
    username: string,
    password: string
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  },

  logout: async (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 2));
  },

  me: async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('No access token');
    }

    const res = await apiFetch('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Not authenticated');
    }

    return res.json();
  },

  refresh: async () => {
    const token = await refreshAccessToken();
    if (!token) throw new Error('Refresh failed');
  },

  getStats: async (): Promise<IncidentStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          open: 12,
          inProgress: 5,
          closed: 142,
          cancelled: 3, // New stat
          byService: [
            { name: 'IT', value: 45 },
            { name: 'Logistique', value: 30 },
            { name: 'Finance', value: 15 },
            { name: 'RH', value: 10 },
          ],
          byStatus: [
            { name: 'Ouvert', value: 12 },
            { name: 'En cours', value: 5 },
            { name: 'Résolu', value: 8 },
            { name: 'Clôturé', value: 134 },
            { name: 'Annulé', value: 3 },
          ]
        });
      }, MOCK_DELAY);
    });
  },

  getIncidents: async (): Promise<Incident[]> => {
    const response = await apiFetch('/incidents', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur lors du chargement des incidents');
    }

    return response.json();
  },

  getTasks: async (incidentId: string): Promise<Task[]> => {
    const response = await apiFetch(`/incidents/${incidentId}/tasks`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors du chargement des tâches'
      );
    }

    return response.json();
  },

  createTask: async (formData: FormData) => {
    const res = await apiFetch('/tasks', {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  updateTask: async (taskId: string, updates: FormData): Promise<Task> => {
    const response = await apiFetch(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: updates
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur lors de la mise à jour de la tâche');
    }

    return response.json();
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const res = await apiFetch(`/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Erreur lors de la suppression de la tâche');
    }
  },

  getAllTasks: async (): Promise<Task[]> => {
    const response = await apiFetch('/tasks', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Impossible de récupérer les tâches');
    }

    return response.json();
  },

  getTaskById: async (taskId: string): Promise<Task> => {
    const response = await apiFetch(`/tasks/${taskId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Tâche introuvable');
    }

    return response.json();
  },

  deleteTaskAttachments: async (taskId: string): Promise<void> => {
    const response = await apiFetch(`/tasks/${taskId}/attachments`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression des pièces jointes');
    }
  },



  createIncident: async (formData: FormData): Promise<Incident> => {
    const response = await apiFetch('/incidents', {
      method: 'POST',
      body: formData, // PAS de JSON.stringify
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur lors de la création de l’incident');
    }

    return response.json();
  },


  getIncidentById: async (id: string): Promise<Incident> => {
    const response = await apiFetch(`/incidents/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Incident introuvable');
    }

    return response.json();
  },

  updateIncident: async (
    id: string,
    formData: FormData
  ): Promise<Incident> => {
    const response = await apiFetch(`/incidents/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur lors de la mise à jour de l’incident');
    }

    return response.json();
  },

  deleteIncidentAttachment(incidentId: string, attachmentId: string) {
    return apiFetch(
      `/incidents/${incidentId}/attachments/${attachmentId}`,
      { method: 'DELETE' }
    );
  },

  updateIncidentAttachments(id: string, formData: FormData) {
    return apiFetch(`/incidents/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  deleteIncident: async (id: string): Promise<void> => {
    const response = await apiFetch(`/incidents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur lors de la suppression de l’incident');
    }
  },

  getSites: async (): Promise<Site[]> => {
    const response = await apiFetch('/sites', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sites');
    }

    return response.json();
  },


  createSite: async (payload: { name: string }): Promise<Site> => {
    const response = await apiFetch('/sites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erreur création site');
    }

    return response.json();
  },

  getSiteById: async (id: string): Promise<Site> => {
    const response = await apiFetch(`/sites/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Site introuvable');
    }

    return response.json();
  },

  updateSite: async (id: string, payload: { name: string }): Promise<Site> => {
    const response = await apiFetch(`/sites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erreur modification site');
    }

    return response.json();
  },

  deleteSite: async (id: string): Promise<void> => {
    const response = await apiFetch(`/sites/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression site');
    }

    return response.json();
  },

  // --- Category Methods ---
  getCategories: async (): Promise<Category[]> => {
    const response = await apiFetch('/categories', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des catégories');
    }

    return response.json();
  },

  getCategoryById: async (id: string): Promise<Category | undefined> => {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Catégorie introuvable');
    }

    return response.json();
  },
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur création catégorie');
    }

    return response.json();
  },
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur modification catégorie');
    }

    return response.json();
  },
  deleteCategory: async (id: string): Promise<void> => {
    const response = await apiFetch(`/categories/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression catégorie');
    }

    return response.json();
  },


  // --- SubCategory Methods ---
  getSubCategories: async (): Promise<SubCategory[]> => {
    const response = await apiFetch('/sub-categories', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sous-catégories');
    }

    return response.json();
  },
  getSubCategoryById: async (id: string): Promise<SubCategory | undefined> => {
    const response = await apiFetch(`/sub-categories/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Sous-catégorie introuvable');
    }

    return response.json();
  },
  createSubCategory: async (data: Partial<SubCategory>): Promise<SubCategory> => {
    const response = await apiFetch('/sub-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur création sous-catégorie');
    }

    return response.json();
  },
  updateSubCategory: async (id: string, updates: Partial<SubCategory>): Promise<SubCategory> => {
    const response = await apiFetch(`/sub-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Erreur modification sous-catégorie');
    }

    return response.json();
  },
  deleteSubCategory: async (id: string): Promise<void> => {
    const response = await apiFetch(`/sub-categories/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression sous-catégorie');
    }

    return response.json();
  },

  // --- Process Methods ---
  getProcesses: async (): Promise<Process[]> => {
    const response = await apiFetch('/processes', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des processus');
    }

    return response.json();
  },
  getProcessById: async (id: string): Promise<Process | undefined> => {
    const response = await apiFetch(`/processes/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Processus introuvable');
    }

    return response.json();
  },
  createProcess: async (data: Partial<Process>): Promise<Process> => {
    const response = await apiFetch('/processes', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur création processus');
    }

    return response.json();
  },
  updateProcess: async (id: string, updates: Partial<Process>): Promise<Process> => {
    const response = await apiFetch(`/processes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Erreur modification processus');
    }

    return response.json();
  },
  deleteProcess: async (id: string): Promise<void> => {
    const response = await apiFetch(`/processes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression processus');
    }

    return response.json();
  },

  // --- SubProcess Methods ---
  getSubProcesses: async (): Promise<SubProcess[]> => {
    const response = await apiFetch('/sub-processes', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sous-processus');
    }

    return response.json();
  },

  getSubProcessById: async (id: string): Promise<SubProcess | undefined> => {
    const response = await apiFetch(`/sub-processes/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Processus introuvable');
    }

    return response.json();

  },

  createSubProcess: async (
    data: Partial<SubProcess>
  ): Promise<SubProcess> => {
    const response = await apiFetch('/sub-processes', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur création du sous-processus');
    }

    return response.json();
  },

  updateSubProcess: async (
    id: string,
    updates: Partial<SubProcess>
  ): Promise<SubProcess> => {
    const response = await apiFetch(`/sub-processes/${id}`, {
      method: 'PUT', // ou PATCH selon ton API
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Erreur mise à jour du sous-processus');
    }

    return response.json();
  },

  deleteSubProcess: async (id: string): Promise<void> => {
    const response = await apiFetch(`/sub-processes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression sous-processus');
    }

    return response.json();
  },

  getUsers: async (): Promise<User[]> => {
    const response = await apiFetch('/users', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des utilisateurs');
    }

    return response.json();
  },

/**
   * 🔹 Détail d’un utilisateur
   */
  getUserById: async (id: number): Promise<User> => {
    const response = await apiFetch(`/users/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement de l’utilisateur');
    }

    return response.json();
  },

  /**
   * 🔹 Création d’un utilisateur
   */
  
  createUser: async (data: CreateUserDTO): Promise<User> => {
    const response = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création de l’utilisateur');
    }

    return response.json();
  },

  /**
   * 🔹 Mise à jour d’un utilisateur
   */
  updateUser: async (
    id: number,
    updates: UpdateUserDTO
  ): Promise<User> => {
    const response = await apiFetch(`/users/${id}`, {
      method: 'PUT', // ✅ PATCH
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour de l’utilisateur');
    }

    return response.json();
  },

  /**
   * 🔹 Suppression d’un utilisateur
   */
  deleteUser: async (id: number): Promise<void> => {
    const response = await apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l’utilisateur');
    }
  },

  getIncidentAttachments: async (
    incidentId: string
  ): Promise<IncidentAttachment[]> => {
    const res = await apiFetch(
      `/incidents/${incidentId}/attachments`
    );

    if (!res.ok) {
      throw new Error('Failed to fetch incident attachments');
    }

    const data = await res.json();

    const list = Array.isArray(data)
      ? data
      : data.data ?? data.attachments ?? [];

    return list.map((a: any) => ({
      id: a.id,
      fileName: a.fileName ?? a.filename,
      url: a.url ?? a.path,
      mimeType: a.mimeType ?? a.mimetype,
    }));
  },

  getIncidentReportPdf: async (id: string): Promise<Blob> => {
    const response = await apiFetch(
      `/incidents/${id}/report/pdf`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      let message = 'Erreur génération du rapport PDF';
      try {
        const error = await response.json();
        message = error?.message || message;
      } catch {
        // réponse non JSON (PDF)
      }
      throw new Error(message);
    }

    return response.blob();
  },

  // --- RBAC: Permissions ---
  /**
   * 🔹 Liste des permissions
   */
  getPermissions: async (): Promise<Permission[]> => {
    const response = await apiFetch('/permissions', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors du chargement des permissions'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Détail d’une permission
   */
  getPermissionById: async (id: number): Promise<Permission> => {
    const response = await apiFetch(`/permissions/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors du chargement de la permission'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Création d’une permission
   */
  createPermission: async (
    data: Pick<Permission, 'code'>
  ): Promise<Permission> => {
    const response = await apiFetch('/permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la création de la permission'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Mise à jour d’une permission
   */
  updatePermission: async (
    id: number,
    updates: Partial<Permission>
  ): Promise<Permission> => {
    const response = await apiFetch(`/permissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la mise à jour de la permission'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Suppression d’une permission
   */
  deletePermission: async (id: number): Promise<void> => {
    const response = await apiFetch(`/permissions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la suppression de la permission'
      );
    }
  },

  // --- RBAC: Roles ---
  /**
   * 🔹 Liste des rôles
   */
  getRoles: async (): Promise<Role[]> => {
    const response = await apiFetch('/roles', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors du chargement des rôles'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Détail d’un rôle
   */
  getRoleById: async (id: number): Promise<Role> => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors du chargement du rôle'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Création d’un rôle
   */
  createRole: async (
    data: Pick<Role, 'name'>
  ): Promise<Role> => {
    const response = await apiFetch('/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la création du rôle'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Mise à jour d’un rôle
   */
  updateRole: async (
    id: number,
    updates: Partial<Role>
  ): Promise<Role> => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la mise à jour du rôle'
      );
    }

    return response.json();
  },

  /**
   * 🔹 Suppression d’un rôle
   */
  deleteRole: async (id: number): Promise<void> => {
    const response = await apiFetch(`/roles/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la suppression du rôle'
      );
    }
  },

  /**
   * 🔹 Permissions d’un rôle
   * GET /roles/{roleId}/permissions
   */
  getRolePermissions: async (roleId: number): Promise<number[]> => {
    const response = await apiFetch(`/roles/${roleId}/permissions`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors du chargement des permissions du rôle'
      );
    }

    // retourne uniquement les permissionId[]
    return response.json();
  },

  /**
   * 🔹 Assigner / synchroniser les permissions d’un rôle
   * PUT /roles/{roleId}/permissions
   */
  updateRolePermissions: async (
    roleId: number,
    permissionIds: number[]
  ): Promise<void> => {
    const response = await apiFetch(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la mise à jour des permissions du rôle'
      );
    }
  },

  /**
   * 🔹 Ajouter une permission à un rôle
   * POST /roles/{roleId}/permissions/{permissionId}
   */
  createRolePermission: async (
    roleId: number,
    permissionId: number
  ): Promise<void> => {
    const response = await apiFetch(
      `/roles/${roleId}/permissions/${permissionId}`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de l’assignation de la permission'
      );
    }
  },

  /**
   * 🔹 Retirer une permission d’un rôle
   * DELETE /roles/{roleId}/permissions/{permissionId}
   */
  deleteRolePermission: async (
    roleId: number,
    permissionId: number
  ): Promise<void> => {
    const response = await apiFetch(
      `/roles/${roleId}/permissions/${permissionId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error?.message || 'Erreur lors de la suppression de la permission du rôle'
      );
    }
  },

  getIncidentAttachment: async (
    incidentId: string,
    attachmentId: string
  ): Promise<Blob> => {
    const response = await apiFetch(
      `/incidents/${incidentId}/attachments/${attachmentId}/download`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du téléchargement');
    }

    return response.blob();
  },

  getSimpleStats: async (): Promise<{
    open: number;
    inProgress: number;
    closed: number;
    cancelled: number;
  }> => {
    const response = await apiFetch('/incidents/stats/simple', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération stats');
    }

    return response.json();
  },

};