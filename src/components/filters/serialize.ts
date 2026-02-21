import type { FilterRowState, Logic } from "./types";
import { INCIDENT_FILTER_COLUMNS } from "../../constants/incidentFilterColumns";
import { dayBoundsUtc } from "../../utils/dateBounds";

export type QueryPayload = {
  logic: Logic;
  filters: { field: string; op: string; value?: any }[];
  sort: { field: string; dir: "asc" | "desc" }[];
  page: number;
  pageSize: number;
  tz: string;
};

// ✅ Helpers de type (pour éviter les comparaisons "impossibles" TS)
function isDateLike(t: unknown): t is "date" | "datetime" {
  return t === "date" || t === "datetime";
}

function isNumberLike(t: unknown): t is "number" {
  return t === "number";
}

function isSiteServiceSelect(t: unknown): t is "siteServiceSelect" {
  return t === "siteServiceSelect";
}

export function serializeToPayload(args: {
  logic: Logic;
  rows: FilterRowState[];
  page: number;
  pageSize: number;
  tz: string;
}): QueryPayload {
  const { logic, rows, page, pageSize, tz } = args;

  const filters = rows
    .map((r) => {
      const col = INCIDENT_FILTER_COLUMNS.find((c) => c.field === r.field);
      if (!col) return null;

      // operators without value
      if (r.op === "isEmpty" || r.op === "isNotEmpty") {
        return { field: r.field, op: r.op };
      }

      // ✅ siteSelect (emitterSiteId / receiverSiteId)
      if ((col as any).type === "siteSelect") {
        if (r.op === "in") {
          const arr = Array.isArray(r.value) ? r.value : [];
          if (arr.length === 0) return null;
          return { field: r.field, op: "in", value: arr.map(Number).filter(Number.isFinite) };
        }

        const n = Number(r.value);
        if (!Number.isFinite(n)) return null;
        return { field: r.field, op: r.op, value: n };
      }

      // date/datetime special handling
      if (isDateLike((col as any).type) && r.op === "between") {
        const v: [string, string] =
          Array.isArray(r.value) && r.value.length >= 2
            ? [String(r.value[0] ?? ""), String(r.value[1] ?? "")]
            : ["", ""];

        if (!v[0] || !v[1]) return null;

        const a = dayBoundsUtc(v[0]).startIso;
        const b = dayBoundsUtc(v[1]).endIso;
        return { field: r.field, op: "between", value: [a, b] };
      }

      if (isDateLike((col as any).type) && r.op === "dayEq") {
        if (!r.value) return null;
        const { startIso, endIso } = dayBoundsUtc(String(r.value));
        return { field: r.field, op: "between", value: [startIso, endIso] };
      }

      if (isDateLike((col as any).type) && (r.op === "gte" || r.op === "lte")) {
        if (!r.value) return null;
        const { startIso, endIso } = dayBoundsUtc(String(r.value));
        return { field: r.field, op: r.op, value: r.op === "gte" ? startIso : endIso };
      }

      // number between
      if (isNumberLike((col as any).type) && r.op === "between") {
        const v: [number | "", number | ""] =
          Array.isArray(r.value) && r.value.length >= 2
            ? [r.value[0] ?? "", r.value[1] ?? ""]
            : ["", ""];

        if (v[0] === "" || v[1] === "") return null;
        return { field: r.field, op: "between", value: [Number(v[0]), Number(v[1])] };
      }

      // default
      if (
        r.value === undefined ||
        r.value === "" ||
        (Array.isArray(r.value) && r.value.length === 0)
      )
        return null;

      return { field: r.field, op: r.op, value: r.value };
    })
    .filter(Boolean) as QueryPayload["filters"];

  return {
    logic,
    filters,
    sort: [{ field: "createdAt", dir: "desc" }],
    page,
    pageSize,
    tz,
  };
}