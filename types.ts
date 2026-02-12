// User Roles
//export type UserRole = 'USER' | 'ARBITRE' | 'ADMIN' | 'MANAGER';
export interface User {
  id: number;
  username: string;
  isActive: boolean;

  roles: {
    id: number;
    name: string;
  }[];

  // 🔐 Appartenance à UN site
  siteId: number | null;
  site?: {
    id: number;
    name: string;
  } | null;

  createdAt: string;
  updatedAt?: string;
}


export type CreateUserDTO = {
  username: string;
  password: string;
  isActive?: boolean;
  roleIds?: number[];
  siteId?: number | null;
};

/**
 * DTO utilisé pour la mise à jour d’un utilisateur
 */
export type UpdateUserDTO = {
  username?: string;
  password?: string;
  isActive?: boolean;
  roleIds?: number[];
  siteId?: number | null;
};

// Incident Types
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Urgency = 'Faible' | 'Moyenne' | 'Haute' | 'Immédiate';
export type Criticality = 'Faible' | 'Moyenne' | 'Haute' | 'Critique';

export interface Incident {
  id: string;
  reference: string;
  status: IncidentStatus;
  priority: Priority;
  urgency: Urgency;
  site: string;
  service: string;
  categoryId: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  description: string;
  scope?: string | null;
  criticality: Criticality;
  reporterId: string;
  subProcessId?: string;
  subCategoryId: string;
  otherSubCategory?: string;
  processDomainId?: string;
  sites: Site[];
  impactedSites: Site[];
  assignedUsers?: User[];
  serviceEmitter?: string | null;
}

export interface IncidentStats {
  open: number;
  inProgress: number;
  closed: number;
  cancelled: number;
  byService: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
}

// Task Types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: number;
  name: string;
  description?: string;
  assignedTo: string;
  status: TaskStatus;
  dueDate: string;
  incidentId: string;
  attachments: Attachment[];
}

export interface Site {
  id: number;
  name: string;

  createdByUserId: number;
  createdBy?: {
    id: number;
    username: string;
  };

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}


export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
}

export interface Process {
  id: string;
  name: string;
  description?: string;
}

export interface SubProcess {
  id: string;
  name: string;
  description?: string;
  processId: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Admin / RBAC Types
export interface Permission {
  id: number;
  code: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface RolePermission {
  permissionId: number;
  roleId: number;
}

export interface UserRole {
  userId: number;
  roleId: number;
}

export interface Attachment {
  id: number;
  fileName: string;
  url: string;
  incidentId: number | null;
  taskId: number | null;
  uploadedAt: Date; // ou string si tu récupères une date ISO depuis l’API
}
