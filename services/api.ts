import { Incident, IncidentStats, User, Task, Site, Category, SubCategory, Process, SubProcess } from '../types';
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
  { id: 't2', title: 'Redémarrer le service', status: 'IN_PROGRESS', assignedTo: 'Jean Dupont', dueDate: '2023-10-25', description: 'Procédure standard de redémarrage via SSH.' },
  { id: 't3', title: 'Rédiger le rapport REX', status: 'TODO', assignedTo: 'Pending', dueDate: '2023-10-26', description: 'Inclure les logs et les captures d\'écran.' },
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

export const api = {
  login: async (username: string, password: string): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_USER), MOCK_DELAY);
    });
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
      setTimeout(() => resolve(MOCK_TASKS), MOCK_DELAY);
    });
  },

  getTaskById: async (taskId: string): Promise<Task | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_TASKS.find(t => t.id === taskId)), MOCK_DELAY);
    });
  },

  getAllTasks: async (): Promise<Task[]> => {
      return new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_TASKS), MOCK_DELAY);
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
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_SITES), MOCK_DELAY);
    });
  },

  getSiteById: async (id: string): Promise<Site | undefined> => {
      return new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_SITES.find(s => s.id === id)), MOCK_DELAY);
      });
  },

  createSite: async (data: Partial<Site>): Promise<Site> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              const newSite: Site = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: data.name || 'Nouveau Site'
              };
              MOCK_SITES.push(newSite);
              resolve(newSite);
          }, MOCK_DELAY);
      });
  },

  updateSite: async (id: string, updates: Partial<Site>): Promise<Site> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const index = MOCK_SITES.findIndex(s => s.id === id);
              if (index !== -1) {
                  MOCK_SITES[index] = { ...MOCK_SITES[index], ...updates };
                  resolve(MOCK_SITES[index]);
              } else {
                  reject("Site not found");
              }
          }, MOCK_DELAY);
      });
  },

  deleteSite: async (id: string): Promise<void> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              const index = MOCK_SITES.findIndex(s => s.id === id);
              if (index !== -1) {
                  MOCK_SITES.splice(index, 1);
              }
              resolve();
          }, MOCK_DELAY);
      });
  },

  // --- Category Methods ---
  getCategories: async (): Promise<Category[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_CATEGORIES), MOCK_DELAY));
  },
  getCategoryById: async (id: string): Promise<Category | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_CATEGORIES.find(c => c.id === id)), MOCK_DELAY));
  },
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newItem: Category = { id: Math.random().toString(36).substr(2, 9), name: data.name || '', description: data.description };
            MOCK_CATEGORIES.push(newItem);
            resolve(newItem);
        }, MOCK_DELAY);
    });
  },
  updateCategory: async (id: string, updates: Partial<Category>): Promise<Category> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const index = MOCK_CATEGORIES.findIndex(c => c.id === id);
              if (index !== -1) { MOCK_CATEGORIES[index] = { ...MOCK_CATEGORIES[index], ...updates }; resolve(MOCK_CATEGORIES[index]); }
              else reject("Not found");
          }, MOCK_DELAY);
      });
  },
  deleteCategory: async (id: string): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const index = MOCK_CATEGORIES.findIndex(c => c.id === id);
              if (index !== -1) MOCK_CATEGORIES.splice(index, 1);
              resolve();
          }, MOCK_DELAY);
      });
  },

  // --- SubCategory Methods ---
  getSubCategories: async (): Promise<SubCategory[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SUB_CATEGORIES), MOCK_DELAY));
  },
  getSubCategoryById: async (id: string): Promise<SubCategory | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SUB_CATEGORIES.find(c => c.id === id)), MOCK_DELAY));
  },
  createSubCategory: async (data: Partial<SubCategory>): Promise<SubCategory> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newItem: SubCategory = { id: Math.random().toString(36).substr(2, 9), name: data.name || '', description: data.description };
            MOCK_SUB_CATEGORIES.push(newItem);
            resolve(newItem);
        }, MOCK_DELAY);
    });
  },
  updateSubCategory: async (id: string, updates: Partial<SubCategory>): Promise<SubCategory> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const index = MOCK_SUB_CATEGORIES.findIndex(c => c.id === id);
              if (index !== -1) { MOCK_SUB_CATEGORIES[index] = { ...MOCK_SUB_CATEGORIES[index], ...updates }; resolve(MOCK_SUB_CATEGORIES[index]); }
              else reject("Not found");
          }, MOCK_DELAY);
      });
  },
  deleteSubCategory: async (id: string): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const index = MOCK_SUB_CATEGORIES.findIndex(c => c.id === id);
              if (index !== -1) MOCK_SUB_CATEGORIES.splice(index, 1);
              resolve();
          }, MOCK_DELAY);
      });
  },

  // --- Process Methods ---
  getProcesses: async (): Promise<Process[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_PROCESSES), MOCK_DELAY));
  },
  getProcessById: async (id: string): Promise<Process | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_PROCESSES.find(c => c.id === id)), MOCK_DELAY));
  },
  createProcess: async (data: Partial<Process>): Promise<Process> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newItem: Process = { id: Math.random().toString(36).substr(2, 9), name: data.name || '', description: data.description };
            MOCK_PROCESSES.push(newItem);
            resolve(newItem);
        }, MOCK_DELAY);
    });
  },
  updateProcess: async (id: string, updates: Partial<Process>): Promise<Process> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const index = MOCK_PROCESSES.findIndex(c => c.id === id);
              if (index !== -1) { MOCK_PROCESSES[index] = { ...MOCK_PROCESSES[index], ...updates }; resolve(MOCK_PROCESSES[index]); }
              else reject("Not found");
          }, MOCK_DELAY);
      });
  },
  deleteProcess: async (id: string): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const index = MOCK_PROCESSES.findIndex(c => c.id === id);
              if (index !== -1) MOCK_PROCESSES.splice(index, 1);
              resolve();
          }, MOCK_DELAY);
      });
  },

  // --- SubProcess Methods ---
  getSubProcesses: async (): Promise<SubProcess[]> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SUB_PROCESSES), MOCK_DELAY));
  },
  getSubProcessById: async (id: string): Promise<SubProcess | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_SUB_PROCESSES.find(c => c.id === id)), MOCK_DELAY));
  },
  createSubProcess: async (data: Partial<SubProcess>): Promise<SubProcess> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newItem: SubProcess = { id: Math.random().toString(36).substr(2, 9), name: data.name || '', description: data.description };
            MOCK_SUB_PROCESSES.push(newItem);
            resolve(newItem);
        }, MOCK_DELAY);
    });
  },
  updateSubProcess: async (id: string, updates: Partial<SubProcess>): Promise<SubProcess> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const index = MOCK_SUB_PROCESSES.findIndex(c => c.id === id);
              if (index !== -1) { MOCK_SUB_PROCESSES[index] = { ...MOCK_SUB_PROCESSES[index], ...updates }; resolve(MOCK_SUB_PROCESSES[index]); }
              else reject("Not found");
          }, MOCK_DELAY);
      });
  },
  deleteSubProcess: async (id: string): Promise<void> => {
      return new Promise(resolve => {
          setTimeout(() => {
              const index = MOCK_SUB_PROCESSES.findIndex(c => c.id === id);
              if (index !== -1) MOCK_SUB_PROCESSES.splice(index, 1);
              resolve();
          }, MOCK_DELAY);
      });
  },
};