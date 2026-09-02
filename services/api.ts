import { Incident, IncidentStats, TrendDay, ServiceVolume, PriorityStats, OverdueStats, DailyActivity, CategoryProcessStats, User, Task, Site, Category, SubCategory, Process, SubProcess, Permission, Role, RolePermission, UpdateUserDTO, CreateUserDTO, Personne, Type, RegisterAccountDTO, WeeklyReportPeriod, WeeklyReportData } from '../types';
import { MOCK_DELAY } from '../constants';
import { IncidentAttachment } from '@/src/types/attachment';

//const API_BASE_URL = 'http://localhost:3002/api/v1';
const API_BASE_URL = "/api/incident";

type AuthFailureHandler = () => void;

let authFailureHandler: AuthFailureHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const registerAuthFailureHandler = (handler: AuthFailureHandler) => {
  authFailureHandler = handler;
};

/**
 * Rouvre un incident archivé (CLOSED ou CANCELLED)
 */
export const reopenIncident = async (id: string | number) => {
  const res = await apiFetch(`/incidents/${id}/reopen`, {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let message = 'Erreur lors de la réouverture de l’incident';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
};


const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const notifyAuthFailure = () => {
  clearSession();

  if (authFailureHandler) {
    authFailureHandler();
    return;
  }

  if (window.location.pathname !== '/incident/login') {
    window.location.replace('/incident/login');
  }
};


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

  const isAuthRoute =
    path === '/auth/login' ||
    path === '/auth/refresh' ||
    path === '/auth/logout';

  if (response.status === 401 && !isAuthRoute) {
    const newToken = await getFreshAccessToken();

    if (!newToken) {
      notifyAuthFailure();
      throw new Error('Session expirée');
    }

    token = newToken;
    response = await doFetch();

    if (response.status === 401) {
      notifyAuthFailure();
      throw new Error('Session expirée');
    }
  }

  return response;
};

interface JwtPayload {
  id: string | number;
  username: string;
  fullName: string;
  roles?: string[];
  permissions?: string[];
}

export function decodeJwt(token: string): JwtPayload {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
}

/**
 * 🔹 Changement de mot de passe par un admin (sans ancien mot de passe)
 */
export async function adminSetUserPassword(id: number, newPassword: string): Promise<void> {
  const response = await apiFetch(`/users/${id}/admin-set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur lors du changement de mot de passe.');
  }
}


/**
 * 🔹 Réinitialisation du mot de passe (reset-password)
 */
export async function resetPassword(token: string, password: string): Promise<any> {
  const response = await apiFetch(`/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de la réinitialisation.');
  }
  return data;
}


/**
 * 🔹 Demande de récupération de mot de passe
 */
export async function forgotPassword(email: string): Promise<void> {
  const response = await apiFetch(`/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur lors de la demande de récupération.');
  }
}

/**
 * 🔹 Changement de mot de passe utilisateur (self-service)
 */
export async function changeUserPassword(
  id: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const response = await apiFetch(`/users/${id}/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur lors du changement de mot de passe.');
  }
}


const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (!data?.accessToken || !data?.refreshToken) {
      return null;
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return data.accessToken;
  } catch {
    return null;
  }
};


const getFreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const api = {
  // ...existing code...
  changeUserPassword,
  reopenIncident,

  registerAccount: async (payload: RegisterAccountDTO): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Registration failed');
    }

    return response.json();
  },


  login: async (
    username: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Login failed');
    }

    const data = await response.json();

    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Invalid login response');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  // logout: async (): Promise<void> => {
  //   return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 2));
  // },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // best effort
    } finally {
      notifyAuthFailure();
    }
  },

  me: async () => {
    const res = await apiFetch('/auth/me', {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error('Not authenticated');
    }

    return res.json();
  },

  refresh: async () => {
    const token = await getFreshAccessToken();
    if (!token) {
      notifyAuthFailure();
      throw new Error('Refresh failed');
    }
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

  queryIncidents: async (payload: any) => {
    const response = await apiFetch(`/incidents/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur lors du chargement des incidents");
    }

    return response.json();
  },

  getIncidents: async (
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Incident[];
    total: number;
    page: number;
    totalPages: number;
  }> => {

    const response = await apiFetch(
      `/incidents?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );

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

  addTaskAttachments(taskId: string, formData: FormData) {
    return apiFetch(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
    });
  },


  createIncident: async (formData: FormData): Promise<Incident> => {
    const response = await apiFetch('/incidents', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text(); // récupère même si ce n’est pas du JSON
      let details: any = text;
      try { details = JSON.parse(text); } catch { }

      console.error("[createIncident] HTTP", response.status, details);

      throw new Error(
        (details && (details.message || details.error)) ||
        `Erreur serveur (${response.status})`
      );
    }
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as Incident);
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

  updateIncident: async (id: string, formData: FormData): Promise<Incident> => {
    const response = await apiFetch(`/incidents/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = raw;
      try {
        const parsed = JSON.parse(raw);
        message = parsed?.message ?? raw;
      } catch { }
      throw new Error(message || `HTTP ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as Incident);
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


  closeIncident: async (id: string | number, payload: { content: string }) => {
    const res = await apiFetch(`/incidents/${id}/close`, {
      method: "PUT",
      body: JSON.stringify({ content: payload.content }),
    });

    // helper: extrait un message lisible quel que soit le format renvoyé
    const buildErrorMessage = (status: number, statusText: string, errBody: any) => {
      const parts: string[] = [];

      // En-tête HTTP
      parts.push(`Clôture incident impossible (${status} ${statusText})`);

      // Champs backend possibles
      const main =
        errBody?.error ??
        errBody?.message ??
        errBody?.detail ??
        errBody?.title;

      if (typeof main === "string" && main.trim()) {
        parts.push(main.trim());
      }

      // Zod / validation: issues
      if (Array.isArray(errBody?.issues) && errBody.issues.length) {
        const issues = errBody.issues
          .map((i: any) => {
            const path = Array.isArray(i?.path) ? i.path.join(".") : "";
            const msg = i?.message ? String(i.message) : "Invalid value";
            return path ? `${path}: ${msg}` : msg;
          })
          .join(" | ");
        parts.push(`Détails: ${issues}`);
      }

      // Fallback si body texte brut
      if (!main && typeof errBody === "string" && errBody.trim()) {
        parts.push(errBody.trim());
      }

      return parts.join(" — ");
    };

    if (!res.ok) {
      // essaie JSON, sinon texte brut
      const errBody = await res
        .json()
        .catch(async () => await res.text().catch(() => ""));

      throw new Error(buildErrorMessage(res.status, res.statusText, errBody));
    }

    return res.json();
  },

  getSites: async (
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Site[];
    total: number;
    page: number;
    totalPages: number;
  }> => {

    const response = await apiFetch(
      `/sites?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sites');
    }

    return response.json();
  },

  createSite: async (payload: { name: string; typeId: number }): Promise<Site> => {
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

  updateSite: async (
    id: string,
    payload: { name: string; typeId: number }
  ): Promise<Site> => {
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

  getSitesByTypeId: async (
    typeId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Site[]; total: number; page: number; totalPages: number }> => {
    const response = await apiFetch(`/sites/by-type/${typeId}?page=${page}&limit=${limit}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des sites par type");
    }

    return response.json();
  },

  getTypes: async (
    page = 1,
    size = 10
  ): Promise<Type[]> => {
    const response = await apiFetch(`/types?page=${page}&size=${size}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erreur chargement des types");
    }

    return response.json();
  },

  // 2) READ (détail par ID)
  getTypeById: async (id: number | string): Promise<Type> => {
    const response = await apiFetch(`/types/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Erreur getTypeById (${response.status}): ${text || "—"}`);
    }

    return response.json();
  },

  // 3) CREATE
  createType: async (payload: { name: string }): Promise<Type> => {
    const response = await apiFetch(`/types`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur création du type");
    }

    return response.json();
  },

  // 4) UPDATE
  updateType: async (
    id: number,
    payload: { name?: string }
  ): Promise<Type> => {
    const response = await apiFetch(`/types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur modification du type");
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
      const message = await response.text();
      throw new Error(message || 'Erreur lors du chargement des processus');
    }

    const data: Process[] = await response.json();
    return data;
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
    const response = await apiFetch('/sub-processes', { method: 'GET' });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Erreur lors du chargement des sous-processus');
    }

    const data: SubProcess[] = await response.json();
    return data;
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
      method: 'PATCH', // ou PATCH selon ton API
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

  getUsers: async (skip = 0, take = 20): Promise<User[]> => {
    const response = await apiFetch(`/users?skip=${skip}&take=${take}`, {
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

  // --- Personne Methods ---

  getPersonnes: async (): Promise<Personne[]> => {
    const response = await apiFetch('/personnes', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur chargement personnes');
    }

    return response.json();
  },

  getPersonneById: async (id: number): Promise<Personne> => {
    const response = await apiFetch(`/personnes/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Personne introuvable');
    }

    return response.json();
  },

  createPersonne: async (
    data: { fullname: string }
  ): Promise<Personne> => {
    const response = await apiFetch('/personnes', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur création personne');
    }

    return response.json();
  },

  updatePersonne: async (
    id: number,
    data: { fullname: string }
  ): Promise<Personne> => {
    const response = await apiFetch(`/personnes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur modification personne');
    }

    return response.json();
  },

  deletePersonne: async (id: number): Promise<void> => {
    const response = await apiFetch(`/personnes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression personne');
    }
  },


    getSimpleStats: async (): Promise<IncidentStats> => {
    const response = await apiFetch('/incidents/stats/simple', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération stats');
    }

    return response.json();
  },

    getTrend: async (): Promise<TrendDay[]> => {
    const response = await apiFetch('/incidents/stats/trend', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération tendance');
    }

    return response.json();
  },

  getByService: async (): Promise<ServiceVolume[]> => {
    const response = await apiFetch('/incidents/stats/by-service', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération stats par service');
    }

    return response.json();
  },

  getByPriority: async (): Promise<PriorityStats> => {
    const response = await apiFetch('/incidents/stats/priority', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération stats par priorité');
    }

    return response.json();
  },

    getOverdue: async (): Promise<OverdueStats> => {
    const response = await apiFetch('/incidents/stats/overdue', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération stats retard');
    }

    return response.json();
  },

    getDailyActivity: async (): Promise<DailyActivity> => {
    const response = await apiFetch('/incidents/stats/daily-activity', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération activité journalière');
    }

    return response.json();
  },

    getCategoryProcessStats: async (dateFrom?: string): Promise<CategoryProcessStats> => {
    const url = dateFrom
      ? `/incidents/stats/by-category-process?dateFrom=${encodeURIComponent(dateFrom)}`
      : '/incidents/stats/by-category-process';
    const response = await apiFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur récupération stats catégorie/processus');
    }

    return response.json();
  },

  // --- GLPI ---

  getGlpiTickets: async () => {
    const response = await apiFetch(`/glpi/tickets`, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur chargement tickets GLPI");
    }

    const json = await response.json();
    return json.data ?? [];
  },

  getGlpiTicketById: async (id: number) => {
    const response = await apiFetch(`/glpi/tickets/${id}`, { method: "GET" });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Erreur chargement ticket GLPI");
    }

    const json = await response.json();
    return json.data;
  },

  searchGlpiTickets: async (q: string, limit: number = 20) => {
    const response = await apiFetch(`/glpi/tickets/search?q=${encodeURIComponent(q)}&limit=${limit}`, {
      method: "GET",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Erreur recherche tickets GLPI");
    }

    const json = await response.json();
    return json.data ?? [];
  },


  searchGlpiUsers: async (q: string, limit: number = 20) => {
    const qs = new URLSearchParams({
      q,
      limit: String(limit),
    });

    const response = await apiFetch(`/glpi/users/search?${qs.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur recherche users GLPI");
    }

    return response.json(); // { data: [...] }
  },

  /**
   * Récupère tous les utilisateurs GLPI (pour MultiSelect classique)
   */
  getGlpiUsers: async () => {
    const response = await apiFetch(`/glpi-users`, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur chargement utilisateurs GLPI");
    }

    return response.json(); // tableau d'utilisateurs
  },

  /**
   * Table serveur paginée/filtrée sur la table locale GLPITicket (sync GLPI)
   * POST /glpi-tickets/query
   */
  queryGlpiTickets: async (payload: any) => {
    const response = await apiFetch(`/glpi-tickets/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.message || "Erreur lors du chargement des tickets GLPI");
    }

    return response.json();
  },

  exportIncidentsPdf: async (payload: any) => {
    const response = await apiFetch(`/incidents/export/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(errText || "Erreur export PDF");
    }

    return response.blob();
  },

  exportIncidentsExcel: async (payload: any) => {
    const response = await apiFetch(`/incidents/export/excel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(errText || "Erreur export Excel");
    }

    return response.blob();
  },

  /* ─────────────────────────────────────────────── */
  /*  Weekly Report API Methods                      */
  /* ─────────────────────────────────────────────── */

  getAvailableWeeks: async (): Promise<WeeklyReportPeriod[]> => {
    const response = await apiFetch('/reports/weekly/available-weeks', {
      method: 'GET',
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Erreur récupération semaines');
    }
    return response.json();
  },

  getWeeklyReport: async (week?: string): Promise<WeeklyReportData> => {
    const url = week
      ? `/reports/weekly?week=${encodeURIComponent(week)}`
      : '/reports/weekly/current';
    const response = await apiFetch(url, { method: 'GET' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Erreur récupération rapport');
    }
    return response.json();
  },

  exportWeeklyReportPdf: async (week?: string): Promise<Blob> => {
    const response = await apiFetch('/reports/weekly/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(week ? { week } : {}),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(errText || 'Erreur export PDF rapport');
    }
    return response.blob();
  },

  exportWeeklyReportExcel: async (week?: string): Promise<Blob> => {
    const response = await apiFetch('/reports/weekly/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(week ? { week } : {}),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(errText || 'Erreur export Excel rapport');
    }
    return response.blob();
  },

  exportStatisticsPdf: async (payload: { dateFrom?: string; periodLabel?: string }): Promise<Blob> => {
    const response = await apiFetch('/reports/statistics/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(errText || 'Erreur export PDF statistiques');
    }
    return response.blob();
  },

  exportPilotagePdf: async (payload: { dateFrom?: string; periodLabel?: string }): Promise<Blob> => {
    const response = await apiFetch('/reports/pilotage/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(errText || 'Erreur export PDF pilotage');
    }
    return response.blob();
  },
};
