// User Roles
//export type UserRole = 'USER' | 'ARBITRE' | 'ADMIN' | 'MANAGER';
export interface User {
  id: number;
  username: string;
  matricule?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  permissions?: string[];

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
  matricule?: string;
  isActive?: boolean;
  roleIds?: number[];
  siteId?: number | null;
};

export type RegisterAccountDTO = {
  matricule: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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

export type IncidentComment = {
  id: string;
  content: string;
  userId: string;
  createdAt: string; // ou Date selon ton mapping
  user?: { id: string; name: string };
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
  subCategory?: string;
  otherSubCategory?: string;
  processDomainId?: string;
  processDomain?: string;
  subProcess?: string;
  sites: Site[];
  comments?: IncidentComment[];
  impactedSites?: { id: number; name: string }[];
  personnes?: Personne[];
  serviceEmitter?: string | null;
  reporterName: string; // ✅ AJOUT
  glpiTicketId: number | null; // ✅ nouveau
  rootCause?: string | null;
  proposedSolution?: string | null;
  // Premium: assigned GLPI users (array of GLPIUser objects)
  glpiUsers?: any[];
}

export interface IncidentStats {
  open: number;
  inProgress: number;
  closed: number;
  cancelled: number;
  byService: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  // Temps moyens (minutes) calculés côté backend ; null si aucune donnée disponible
  avgTakeInChargeMinutes?: number | null;
  avgResolutionMinutes?: number | null;
}

export interface TrendDay {
  name: string;
  ouverts: number;
  resolus: number;
}

export interface ServiceVolume {
  name: string;
  value: number;
}

export interface PriorityStats {
  byPriority: Array<{ name: string; value: number }>;
  backlogCritical: number;
}

export interface OverdueStats {
  count: number;
}

export interface DailyActivity {
  createdToday: number;
  takenInChargeToday: number;
  resolvedToday: number;
  urgentActive: number;
}

export interface CategoryProcessStats {
  categories: Array<{ name: string; total: number; open: number; inProgress: number; closed: number; cancelled: number }>;
  subCategories: Array<{ name: string; categoryName: string; total: number }>;
  processes: Array<{ name: string; total: number }>;
  subProcesses: Array<{ name: string; processName: string; total: number }>;
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

  // 🔹 Relation Type
  typeId: number;
  type?: Type;

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

export interface Personne {
  id: number;
  fullname: string;
  createdAt: string;   // JSON → string côté front
  updatedAt: string;
  deletedAt?: string | null;
}

export type CreatePersonneDTO = {
  fullname: string;
};

export type UpdatePersonneDTO = Partial<{
  fullname: string;
}>;


/* ─────────────────────────────────────────────── */
/*  Weekly Report Types                           */
/* ─────────────────────────────────────────────── */

export interface WeeklyReportPeriod {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  label: string;
}

export interface WeeklyReportKpi {
  created: number;
  resolved: number;
  resolutionRate: number | null;
  cappedRate: number;
  extraResolvedFromStock: number;
  backlogStart: number;
  backlogEnd: number;
  avgResolutionHours: number | null;
  avgTakeInChargeHours: number | null;
}

export interface WeeklyReportComparison {
  previousWeek: WeeklyReportKpi;
  resolutionRateChange: number | null;
  createdChange: number | null;
  resolvedChange: number | null;
  backlogEndChange: number | null;
  avgResolutionChange: number | null;
}

export interface WeeklyReportByPriority {
  name: string;
  created: number;
  resolved: number;
  rate: number | null;
}

export interface WeeklyReportByService {
  name: string;
  created: number;
  resolved: number;
  rate: number | null;
}

export interface WeeklyReportTrendDay {
  dayLabel: string;
  date: string;
  created: number;
  resolved: number;
}

export interface WeeklyReportData {
  period: WeeklyReportPeriod;
  kpi: WeeklyReportKpi;
  byPriority: WeeklyReportByPriority[];
  byService: WeeklyReportByService[];
  dailyTrend: WeeklyReportTrendDay[];
  comparison: WeeklyReportComparison | null;
  incidents: WeeklyReportIncidentDetail[];
}

export interface WeeklyReportIncidentDetail {
  reference: string;
  description: string;
  status: string;
  priority: string;
  serviceEmetteur: string;
  serviceRecepteur: string;
  createdAt: string;
  rootCause: string | null;
  proposedSolution: string | null;
}

export interface Type {
  id: number;
  name: string;
  createdByUserId: number;
  createdAt: string;   // JSON → string côté front
  updatedAt: string;
  deletedAt?: string | null;
}

