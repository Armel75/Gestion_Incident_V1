export type ColumnType =
  | "string"
  | "enum"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "personneSelect"
  | "siteSelect";

export type Operator =
  | "contains" | "eq" | "neq" | "startsWith" | "endsWith" | "isEmpty" | "isNotEmpty"
  | "gt" | "gte" | "lt" | "lte" | "between" | "in"
  | "dayEq";

export type FilterField =
  | "reference"
  | "description"
  | "status"
  | "urgency"
  | "emitterSiteId"
  | "receiverSiteId"
  | "assignedPersonneId"
  | "createdAt"
  | "dueDate";

export const OPERATORS_BY_TYPE: Record<ColumnType, { op: Operator; label: string; needsValue: boolean }[]> = {
  siteSelect: [
    { op: "eq", label: "égal", needsValue: true },
    { op: "neq", label: "différent", needsValue: true },
    { op: "in", label: "dans la liste", needsValue: true },
    { op: "isEmpty", label: "est vide", needsValue: false },
    { op: "isNotEmpty", label: "n’est pas vide", needsValue: false },
  ],
  personneSelect: [
    { op: "eq", label: "égal", needsValue: true },
    { op: "in", label: "dans la liste", needsValue: true },
    { op: "isEmpty", label: "est vide", needsValue: false },
    { op: "isNotEmpty", label: "n’est pas vide", needsValue: false },
  ],
  string: [
    { op: "contains", label: "contient", needsValue: true },
    { op: "eq", label: "égal", needsValue: true },
    { op: "startsWith", label: "commence par", needsValue: true },
    { op: "endsWith", label: "finit par", needsValue: true },
    { op: "isEmpty", label: "est vide", needsValue: false },
    { op: "isNotEmpty", label: "n’est pas vide", needsValue: false },
  ],
  enum: [
    { op: "eq", label: "égal", needsValue: true },
    { op: "neq", label: "différent", needsValue: true },
    { op: "in", label: "dans la liste", needsValue: true },
  ],
  number: [
    { op: "eq", label: "=", needsValue: true },
    { op: "neq", label: "!=", needsValue: true },
    { op: "gt", label: ">", needsValue: true },
    { op: "gte", label: ">=", needsValue: true },
    { op: "lt", label: "<", needsValue: true },
    { op: "lte", label: "<=", needsValue: true },
    { op: "between", label: "entre", needsValue: true },
    { op: "in", label: "dans la liste", needsValue: true },
  ],
  date: [
    { op: "between", label: "entre", needsValue: true },
    { op: "gte", label: "≥", needsValue: true },
    { op: "lte", label: "≤", needsValue: true },
    { op: "dayEq", label: "égal (jour)", needsValue: true },
  ],
  datetime: [
    { op: "between", label: "entre", needsValue: true },
    { op: "gte", label: "≥", needsValue: true },
    { op: "lte", label: "≤", needsValue: true },
    { op: "dayEq", label: "égal (jour)", needsValue: true },
  ],
  boolean: [{ op: "eq", label: "égal", needsValue: true }],
};

// =============================
// ✅ STATUT: mapping centralisé (single source of truth)
// =============================
export type IncidentStatusDb = "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";

export type StatusOption = Readonly<{ value: IncidentStatusDb; label: string }>;

export const STATUS_OPTIONS: ReadonlyArray<StatusOption> = [
  { value: "OPEN", label: "Ouvert" },
  { value: "IN_PROGRESS", label: "Encours" },
  { value: "CLOSED", label: "Clôturé" },
  { value: "CANCELLED", label: "Annulé" },
] as const;

export const STATUS_LABEL_BY_VALUE: Readonly<Record<string, string>> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "Encours",
  CLOSED: "Clôturé",
  CANCELLED: "Annulé",

  // compat si jamais tu as RESOLVED dans l’historique
  RESOLVED: "Clôturé",
};

export function getStatusLabel(dbValue: unknown): string {
  const v = String(dbValue ?? "");
  return STATUS_LABEL_BY_VALUE[v] ?? v;
}

export const INCIDENT_FILTER_COLUMNS = [
  { field: "reference", label: "Référence", type: "string" as const },
  { field: "description", label: "Description", type: "string" as const },

  // ✅ valeurs DB uniquement (pas de CLOSED ici)
  { field: "status", label: "Statut", type: "enum" as const, enumValues: ["OPEN", "IN_PROGRESS", "CLOSED", "CANCELLED"] },
  { field: "urgency", label: "Priorité", type: "enum" as const, enumValues: ["Faible", "Moyenne", "Haute", "Immédiate"] },
 { field: "emitterSiteId", label: "Site émetteur", type: "siteSelect" as const },
 { field: "receiverSiteId", label: "Site traitant", type: "siteSelect" as const },
  { field: "assignedPersonneId", label: "Assigné (personne)", type: "personneSelect" as const },
  { field: "createdAt", label: "Créé le", type: "datetime" as const },
  { field: "dueDate", label: "Échéance", type: "date" as const },
] as const;