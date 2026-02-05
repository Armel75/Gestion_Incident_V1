// User Roles
export type UserRole = 'USER' | 'ARBITRE' | 'ADMIN' | 'MANAGER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
}

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
  category: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  assignedTo?: User;
  description: string;
  scope?: string | null;
  criticality: Criticality;
  reporterId: string;
  subProcessId?: string;
  subCategoryId: string;
  processDomainId?: string;
  impactedServices?: string[];
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
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  status: TaskStatus;
  dueDate: string;
}

// Settings Types
export interface Site {
  id: string;
  name: string;
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