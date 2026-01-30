import { Incident, IncidentStats, User, UserRole, Task, Site, Category, SubCategory, Process, SubProcess } from '../types';
import { MOCK_DELAY } from '../constants';

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

let MOCK_SUB_CATEGORIES: SubCategory[] = [
  { id: 'sc1', name: 'Ordinateur', description: 'Poste de travail fixe ou portable' },
  { id: 'sc2', name: 'Imprimante', description: 'Imprimantes réseau et locales' },
  { id: 'sc3', name: 'OS', description: 'Système d\'exploitation Windows/Linux/Mac' },
];

let MOCK_PROCESSES: Process[] = [
  { id: 'p1', name: 'Ventes', description: 'Processus commerciaux' },
  { id: 'p2', name: 'Achats', description: 'Gestion des fournisseurs et commandes' },
  { id: 'p3', name: 'Logistique', description: 'Gestion des stocks et expéditions' },
];

let MOCK_SUB_PROCESSES: SubProcess[] = [
  { id: 'sp1', name: 'Commande Client', description: 'Prise et validation de commande' },
  { id: 'sp2', name: 'Facturation', description: 'Émission des factures clients' },
  { id: 'sp3', name: 'Expédition', description: 'Préparation et envoi des colis' },
];

const API_BASE_URL = 'http://localhost:3001/api/v1';

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
};

// const getAuthHeaders = () => {
//   const token = localStorage.getItem('accessToken');
//   return {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${token}`,
//   };
// };


interface JwtPayload {
  id: string | number;
  username: string;
  fullName: string;
  roles?: string[];
}

function decodeJwt(token: string): JwtPayload {
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

  getIncidents: async () => {
    // const res = await apiFetch('/incidents');
    // return res.json();
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_INCIDENTS), MOCK_DELAY);
    });
  },

  getIncidentById: async (id: string): Promise<Incident | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_INCIDENTS.find(i => i.id === id)), MOCK_DELAY);
    });
  },

  updateIncident: async (id: string, updates: Partial<Incident>): Promise<Incident> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_INCIDENTS.findIndex(i => i.id === id);
        if (index !== -1) {
          MOCK_INCIDENTS[index] = { ...MOCK_INCIDENTS[index], ...updates };
          resolve(MOCK_INCIDENTS[index]);
        } else {
          reject("Incident not found");
        }
      }, MOCK_DELAY);
    });
  },

  deleteIncident: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = MOCK_INCIDENTS.findIndex(i => i.id === id);
        if (index !== -1) {
          MOCK_INCIDENTS.splice(index, 1);
        }
        resolve();
      }, MOCK_DELAY);
    });
  },

  getTasks: async (incidentId: string): Promise<Task[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([
        { id: 't1', title: 'Analyser les logs', status: 'DONE', assignedTo: 'Jean Dupont', dueDate: '2023-10-25' },
        { id: 't2', title: 'Redémarrer le service', status: 'IN_PROGRESS', assignedTo: 'Jean Dupont', dueDate: '2023-10-25' },
        { id: 't3', title: 'Rédiger le rapport REX', status: 'TODO', assignedTo: 'Pending', dueDate: '2023-10-26' },
      ]), MOCK_DELAY);
    });
  },

  createTask: async (incidentId: string, taskData: Partial<Task>): Promise<Task> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          title: taskData.title || 'Nouvelle tâche',
          description: taskData.description,
          status: 'TODO',
          assignedTo: 'Unassigned',
          dueDate: new Date().toISOString()
        };
        MOCK_TASKS.push(newTask);
        resolve(newTask);
      }, MOCK_DELAY);
    });
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_TASKS.findIndex(t => t.id === taskId);
        if (index !== -1) {
          MOCK_TASKS[index] = { ...MOCK_TASKS[index], ...updates };
          resolve(MOCK_TASKS[index]);
        } else {
          reject("Task not found");
        }
      }, MOCK_DELAY);
    });
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

  createIncident: async (data: Partial<Incident>): Promise<Incident> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newIncident: Incident = {
          id: Math.random().toString(36).substr(2, 9),
          reference: `INC-2023-${Math.floor(Math.random() * 1000)}`,
          title: data.title || 'Nouvel incident',
          status: 'OPEN',
          priority: data.priority || 'MEDIUM',
          site: data.site || 'Unknown',
          service: data.service || 'General',
          category: data.category || 'Other',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: data.dueDate || new Date().toISOString(),
          description: data.description || '',
          assignedTo: undefined
        };
        MOCK_INCIDENTS.unshift(newIncident);
        resolve(newIncident);
      }, MOCK_DELAY * 2);
    });
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
    const response = await apiFetch('/subcategories', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sous-catégories');
    }

    return response.json();
  },
  getSubCategoryById: async (id: string): Promise<SubCategory | undefined> => {
    const response = await apiFetch(`/subcategories/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Sous-catégorie introuvable');
    }

    return response.json();
  },
  createSubCategory: async (data: Partial<SubCategory>): Promise<SubCategory> => {
    const response = await apiFetch('/subcategories', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur création sous-catégorie');
    }

    return response.json();
  },
  updateSubCategory: async (id: string, updates: Partial<SubCategory>): Promise<SubCategory> => {
    const response = await apiFetch(`/subcategories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Erreur modification sous-catégorie');
    }

    return response.json();
  },
  deleteSubCategory: async (id: string): Promise<void> => {
    const response = await apiFetch(`/subcategories/${id}`, {
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
    const response = await apiFetch('/subprocesses', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des sous-processus');
    }

    return response.json();
  },

  getSubProcessById: async (id: string): Promise<SubProcess | undefined> => {
    const response = await apiFetch(`/subprocess/${id}`, {
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
    const response = await apiFetch(`/subprocesses/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur suppression sous-processus');
    }

    return response.json();
  },
};