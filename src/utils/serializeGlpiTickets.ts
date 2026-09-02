import { GLPI_TICKET_FILTER_COLUMNS } from "../constants/glpiTicketFilterColumns";
import type { GlpiFilterRowState } from "../constants/glpiTicketFilterColumns";
import type { Logic } from "../components/filters/types";
import type { QueryPayload } from "../components/filters/serialize";
import { dayBoundsUtc } from "./dateBounds";

/**
 * Transforme les lignes de filtres (GlpiFilterRowState[]) en payload
 * compatible avec le endpoint serveur POST /glpi-tickets/query.
 * Le tri est fixé sur glpiId desc (les plus récents en premier).
 */
export function serializeGlpiTicketRows(args: {
  logic: Logic;
  rows: GlpiFilterRowState[];
  page: number;
  pageSize: number;
  tz: string;
}): QueryPayload {
  const { logic, rows, page, pageSize, tz } = args;

  const filters = rows
    .map((r): QueryPayload["filters"][number] | null => {
      const col = GLPI_TICKET_FILTER_COLUMNS.find((c) => c.field === r.field);
      if (!col) return null;

      const op = r.op as any;

      // opérateurs sans valeur
      if (op === "isEmpty" || op === "isNotEmpty") {
        return { field: r.field, op };
      }

      const isDate = col.type === "date" || col.type === "datetime";

      // dates : "entre" → bornes jour (inclusif)
      if (isDate && op === "between") {
        const v: [string, string] =
          Array.isArray(r.value) && r.value.length >= 2
            ? [String(r.value[0] ?? ""), String(r.value[1] ?? "")]
            : ["", ""];
        if (!v[0] || !v[1]) return null;
        return {
          field: r.field,
          op: "between",
          value: [dayBoundsUtc(v[0]).startIso, dayBoundsUtc(v[1]).endIso],
        };
      }

      // dates : "égal (jour)" → borne du jour
      if (isDate && op === "dayEq") {
        if (!r.value) return null;
        const { startIso, endIso } = dayBoundsUtc(String(r.value));
        return { field: r.field, op: "between", value: [startIso, endIso] };
      }

      // dates : ≥ / ≤ sur un jour
      if (isDate && (op === "gte" || op === "lte")) {
        if (!r.value) return null;
        const { startIso, endIso } = dayBoundsUtc(String(r.value));
        return { field: r.field, op, value: op === "gte" ? startIso : endIso };
      }

      // nombres : "entre"
      if (col.type === "number" && op === "between") {
        const v: [number | "", number | ""] =
          Array.isArray(r.value) && r.value.length >= 2
            ? [r.value[0] ?? "", r.value[1] ?? ""]
            : ["", ""];
        if (v[0] === "" || v[1] === "") return null;
        return { field: r.field, op: "between", value: [Number(v[0]), Number(v[1])] };
      }

      // valeurs vides → on ignore la ligne
      if (
        r.value === undefined ||
        r.value === "" ||
        (Array.isArray(r.value) && r.value.length === 0)
      ) {
        return null;
      }

      return { field: r.field, op, value: r.value };
    })
    .filter(Boolean) as QueryPayload["filters"];

  return {
    logic,
    filters,
    sort: [{ field: "glpiId", dir: "desc" }],
    page,
    pageSize,
    tz,
  };
}
