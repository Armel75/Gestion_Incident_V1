import React, { useEffect, useState } from "react";
import { INCIDENT_FILTER_COLUMNS, OPERATORS_BY_TYPE } from "../../constants/incidentFilterColumns";
import type { ColumnType } from "../../constants/incidentFilterColumns";
import { api } from "@/services/api";
import { SiteSelectInput } from "./SiteSelectInput";
type Props = {
  field: string;
  op: string;
  value: any;
  onChange: (v: any) => void;
};

export const ValueInput: React.FC<Props> = ({ field, op, value, onChange }) => {
  const col = INCIDENT_FILTER_COLUMNS.find(c => c.field === field) as
  | { field: string; label: string; type: ColumnType; enumValues?: string[] }
  | undefined;
  if (!col) return null;

  const opMeta = OPERATORS_BY_TYPE[col.type].find(x => x.op === op);
  const needsValue = opMeta?.needsValue ?? true;
  if (!needsValue) return <div className="text-xs text-slate-500 italic px-2">—</div>;

    // ✅ SITE SELECT (Service émetteur / traitant = Site)
    if ((col as any).type === "siteSelect") {
        if (op === "in") {
        const v: number[] = Array.isArray(value) ? value : [];
        return (
            <input
            className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            placeholder="ex: 1,2,3"
            value={v.join(",")}
            onChange={(e) =>
                onChange(
                e.target.value
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter(Number.isFinite)
                )
            }
            />
        );
        }

        // eq/neq -> Select Site
        return (
        <SiteSelectInput
            value={value}
            onChange={onChange}
            placeholder="Choisir un site…"
        />
        );
    }
  
    // =============================
    // PERSONNE SELECT
    // =============================
    if (col.type === "personneSelect") {
    const [personnes, setPersonnes] = useState<{ id: number; fullname: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
        try {
            setLoading(true);
            const list = await (api as any).getPersonnes(); // ⚠️ utilise ton endpoint existant
            if (!cancelled) setPersonnes(list);
        } catch (e) {
            console.error(e);
            if (!cancelled) setPersonnes([]);
        } finally {
            if (!cancelled) setLoading(false);
        }
        })();

        return () => {
        cancelled = true;
        };
    }, []);

    if (loading) {
        return <div className="text-xs text-slate-500 italic px-2">Chargement…</div>;
    }

    if (op === "in") {
        const v: number[] = Array.isArray(value) ? value : [];

        return (
        <select
            multiple
            className="h-24 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={v.map(String)}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const select = e.target as HTMLSelectElement;
            const selected = Array.from(select.selectedOptions)
                .map((option: HTMLOptionElement) => Number(option.value))
                .filter(Number.isFinite);

            onChange(selected);
            }}
        >
            {personnes.map(p => (
            <option key={p.id} value={p.id}>{p.fullname}</option>
            ))}
        </select>
        );
    }

    return (
        <select
        className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        >
        <option value="" disabled>Choisir…</option>
        {personnes.map(p => (
            <option key={p.id} value={p.id}>{p.fullname}</option>
        ))}
        </select>
    );
    }

  // ENUM
  if (col.type === "enum") {
    const enumValues = (col as any).enumValues as string[] | undefined;
    if (op === "in") {
      const v: string[] = Array.isArray(value) ? value : [];
      return (
        <input
          className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          placeholder="ex: OPEN,IN_PROGRESS"
          value={v.join(",")}
          onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        />
      );
    }
    return (
      <select
        className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>Choisir…</option>
        {enumValues?.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    );
  }

  // BOOLEAN
  if (col.type === "boolean") {
    return (
      <select
        className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value === "true")}
      >
        <option value="" disabled>Choisir…</option>
        <option value="true">Vrai</option>
        <option value="false">Faux</option>
      </select>
    );
  }

  // NUMBER
  if (col.type === "number") {
    if (op === "between") {
      const v: [number | "", number | ""] =
        Array.isArray(value) && value.length >= 2
            ? [value[0] ?? "", value[1] ?? ""]
            : ["", ""];
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="h-8 w-24 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            placeholder="min"
            value={v[0]}
            onChange={(e) => onChange([e.target.value === "" ? "" : Number(e.target.value), v[1]])}
          />
          <span className="text-xs text-slate-500">et</span>
          <input
            type="number"
            className="h-8 w-24 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            placeholder="max"
            value={v[1]}
            onChange={(e) => onChange([v[0], e.target.value === "" ? "" : Number(e.target.value)])}
          />
        </div>
      );
    }
    if (op === "in") {
      const v: number[] = Array.isArray(value) ? value : [];
      return (
        <input
          className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          placeholder="ex: 1,2,3"
          value={v.join(",")}
          onChange={(e) => onChange(
            e.target.value.split(",").map(s => s.trim()).filter(Boolean).map(Number).filter(n => Number.isFinite(n))
          )}
        />
      );
    }
    return (
      <input
        type="number"
        className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    );
  }

  // DATE / DATETIME
  if (col.type === "date" || col.type === "datetime") {
    if (op === "between") {
      const v: [number | "", number | ""] =
        Array.isArray(value) && value.length >= 2
            ? [value[0] ?? "", value[1] ?? ""]
            : ["", ""];
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={v[0] ?? ""}
            onChange={(e) => onChange([e.target.value, v[1]])}
          />
          <span className="text-xs text-slate-500">et</span>
          <input
            type="date"
            className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={v[1] ?? ""}
            onChange={(e) => onChange([v[0], e.target.value])}
          />
        </div>
      );
    }
    // dayEq / gte / lte: one date
    return (
      <input
        type="date"
        className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // STRING default
  return (
    <input
      className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};