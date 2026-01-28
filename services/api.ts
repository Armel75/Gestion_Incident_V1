import { Incident, IncidentStats, User, UserRole, Task } from '../types';
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
    const res = await apiFetch('/incidents');
    return res.json();
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

  getTasks: async (incidentId: string): Promise<Task[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([
        { id: 't1', title: 'Analyser les logs', status: 'DONE', assignedTo: 'Jean Dupont', dueDate: '2023-10-25' },
        { id: 't2', title: 'Redémarrer le service', status: 'IN_PROGRESS', assignedTo: 'Jean Dupont', dueDate: '2023-10-25' },
        { id: 't3', title: 'Rédiger le rapport REX', status: 'TODO', assignedTo: 'Pending', dueDate: '2023-10-26' },
      ]), MOCK_DELAY);
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
  }
};