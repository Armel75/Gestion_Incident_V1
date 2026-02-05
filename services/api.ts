import { Incident, IncidentStats, User, UserRole, Task, Site, Category, SubCategory, Process, SubProcess } from '../types';
import { MOCK_DELAY } from '../constants';
import { IncidentAttachment } from '@/src/types/attachment';

// Simulating API calls with promises and delays

const MOCK_USER: User = {
  id: 'u1',
  username: 'jdoe',
  fullName: 'Jean Dupont',
  role: 'ADMIN', // Change this to 'USER' or 'MANAGER' to test permissions
  avatarUrl: 'https://picsum.photos/200'
};

const MOCK_INCIDENTS: Incident[] = [
  {
    id: '1',
    reference: 'INC-2023-001',
    title: 'Panne serveur production B2',
    status: 'OPEN',
    priority: 'CRITICAL',
    site: 'Paris La Défense',
    service: 'IT Infrastructure',
    category: 'Hardware',
    createdAt: '2023-10-25T09:00:00Z',
    updatedAt: '2023-10-25T09:30:00Z',
    dueDate: '2023-10-25T13:00:00Z',
    description: 'Le serveur principal de la base de données ne répond plus aux requêtes.',
    assignedTo: MOCK_USER
  },
  {
    id: '2',
    reference: 'INC-2023-002',
    title: 'Erreur impression logistique',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    site: 'Lyon Entrepôt',
    service: 'Logistique',
    category: 'Software',
    createdAt: '2023-10-24T14:00:00Z',
    updatedAt: '2023-10-25T10:00:00Z',
    dueDate: '2023-10-26T14:00:00Z',
    description: 'Les étiquettes sortent avec un décalage de 5mm.',
    assignedTo: undefined
  },
  {
    id: '3',
    reference: 'INC-2023-003',
    title: 'Fuite d\'eau salle repos',
    status: 'RESOLVED',
    priority: 'HIGH',
    site: 'Bordeaux Siège',
    service: 'Services Généraux',
    category: 'Batiment',
    createdAt: '2023-10-23T08:00:00Z',
    updatedAt: '2023-10-24T16:00:00Z',
    dueDate: '2023-10-23T12:00:00Z',
    description: 'Fuite sous l\'évier de la kitchenette.',
    assignedTo: MOCK_USER
  },
  {
    id: '4',
    reference: 'INC-2023-004',
    title: 'Mise à jour logiciel Compta',
    status: 'CLOSED',
    priority: 'LOW',
    site: 'Paris La Défense',
    service: 'Finance',
    category: 'Software',
    createdAt: '2023-10-20T09:00:00Z',
    updatedAt: '2023-10-21T11:00:00Z',
    dueDate: '2023-10-22T09:00:00Z',
    description: 'Demande de mise à jour version 4.5.',
    assignedTo: MOCK_USER
  }
];

let MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Analyser les logs', status: 'DONE', assignedTo: 'Jean Dupont', dueDate: '2023-10-25' },
  { id: 't2', title: 'Redémarrer le service', status: 'IN_PROGRESS', assignedTo: 'Jean Dupont', dueDate: '2023-10-25' },
  { id: 't3', title: 'Rédiger le rapport REX', status: 'TODO', assignedTo: 'Pending', dueDate: '2023-10-26' },
];

let MOCK_SITES: Site[] = [
  { id: 's1', name: 'Paris La Défense' },
  { id: 's2', name: 'Lyon Entrepôt' },
  { id: 's3', name: 'Bordeaux Siège' },
  { id: 's4', name: 'Nantes Agence' },
];

let MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Matériel / Hardware', description: 'Problèmes liés aux équipements physiques' },
  { id: 'c2', name: 'Logiciel / Software', description: 'Problèmes liés aux applications et OS' },
  { id: 'c3', name: 'Réseau / Network', description: 'Connectivité et infrastructure réseau' },
];


const API_BASE_URL = 'http://localhost:3001/api/v1';

  // const apiFetch = async (path: string, options: RequestInit = {}) => {
  //   const token = localStorage.getItem('accessToken');

  //   const isFormData = options.body instanceof FormData;

  //   const headers: HeadersInit = {
  //     ...(options.headers || {}),
  //     ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //   };

  //   // ❗ NE PAS définir Content-Type si FormData
  //   if (!isFormData) {
  //     headers['Content-Type'] = 'application/json';
  //   }

  //   return fetch(`${API_BASE_URL}${path}`, {
  //     ...options,
  //     headers,
  //   });
  // };

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers: HeadersInit = {
      Authorization: token ? `Bearer ${token}` : '',
    };

    // ⚠️ Ne pas définir Content-Type si FormData
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

export const api = {

  login: async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    localStorage.setItem('accessToken', data.accessToken);

    const user = decodeJwt(data.accessToken);
    const role: UserRole =
      Array.isArray(user.roles) &&
        user.roles.length > 0 &&
        typeof user.roles[0] === 'string'
        ? (user.roles[0].toUpperCase() as UserRole)
        : 'USER';

    console.log(user);
    return {
      id: String(user.id),
      username: user.username,
      fullName: user.fullName || user.username,
      role: role,
    };
  },

  logout: async (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY / 2));
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
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = MOCK_TASKS.findIndex(t => t.id === taskId);
        if (index !== -1) {
          MOCK_TASKS.splice(index, 1);
        }
        resolve();
      }, MOCK_DELAY);
    });
  },

  getAllTasks: async (): Promise<Task[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_TASKS), MOCK_DELAY);
    });
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
      method: 'PATCH',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Erreur lors de la mise à jour de l’incident');
    }

    return response.json();
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
};