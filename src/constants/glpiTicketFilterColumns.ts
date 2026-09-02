import type { ColumnType, Operator } from "./incidentFilterColumns";

/* ─── Config des colonnes filtrables de la liste "Ticket GLPI" ─── */
export type GlpiFilterField =
  | "glpiId"
  | "ticketNumber"
  | "title"
  | "description"
  | "status"
  | "priority"
  | "urgency"
  | "impact"
  | "categoryName"
  | "entityName"
  | "locationName"
  | "requesterName"
  | "assigneeName"
  | "openedAt"
  | "dueAt";

export type GlpiFilterColumn = {
  field: GlpiFilterField;
  label: string;
  type: ColumnType;
  enumValues?: string[];
};

export type GlpiFilterRowState = {
  id: string;
  field: GlpiFilterField;
  op: Operator;
  value?: any;
};

export const GLPI_TICKET_FILTER_COLUMNS: GlpiFilterColumn[] = [
  { field: "glpiId", label: "ID Ticket", type: "number" },
  { field: "ticketNumber", label: "N° ticket", type: "string" },
  { field: "title", label: "Titre", type: "string" },
  { field: "description", label: "Description", type: "string" },
  { field: "status", label: "Statut", type: "enum", enumValues: ["1", "2", "3", "4", "5", "6"] },
  { field: "priority", label: "Priorité", type: "enum", enumValues: ["1", "2", "3", "4", "5"] },
  { field: "urgency", label: "Urgence", type: "enum", enumValues: ["1", "2", "3", "4", "5"] },
  { field: "impact", label: "Impact", type: "enum", enumValues: ["1", "2", "3", "4", "5"] },
  { field: "categoryName", label: "Catégorie", type: "string" },
  { field: "entityName", label: "Entité", type: "string" },
  { field: "locationName", label: "Localisation", type: "string" },
  { field: "requesterName", label: "Demandeur", type: "string" },
  { field: "assigneeName", label: "Technicien", type: "string" },
  { field: "openedAt", label: "Ouvert le", type: "datetime" },
  { field: "dueAt", label: "Échéance", type: "datetime" },
];

/* ─── Libellés GLPI (valeurs stockées en chaînes numériques) ─── */
export const GLPI_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Nouveau" },
  { value: "2", label: "En cours" },
  { value: "3", label: "En attente" },
  { value: "4", label: "Résolu" },
  { value: "5", label: "Clôturé" },
  { value: "6", label: "Annulé" },
];

export const GLPI_LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Très basse" },
  { value: "2", label: "Basse" },
  { value: "3", label: "Moyenne" },
  { value: "4", label: "Haute" },
  { value: "5", label: "Très haute" },
];

export function glpiEnumLabel(field: string, value: string): string {
  const list =
    field === "status" ? GLPI_STATUS_OPTIONS : GLPI_LEVEL_OPTIONS;
  return list.find((o) => o.value === value)?.label ?? value;
}
