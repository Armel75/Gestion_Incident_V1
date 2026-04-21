import React, { useEffect, useMemo, useState } from "react";
import {
  INCIDENT_FILTER_COLUMNS,
  OPERATORS_BY_TYPE,
  STATUS_OPTIONS,
  getStatusLabel,
} from "../../constants/incidentFilterColumns";
import type { ColumnType, StatusOption } from "../../constants/incidentFilterColumns";
import { api } from "@/services/api";
import { SiteSelectInput } from "./SiteSelectInput";

type Props = {
  field: string;
  op: string;
  value: any;
  onChange: (v: any) => void;
};

// ✅ Typage personnes (adapte si ton API renvoie "fullName" au lieu de "fullname")
type PersonneItem = { id: number; fullname?: string; fullName?: string; username?: string };

export const ValueInput: React.FC<Props> = ({ field, op, value, onChange }) => {
  const col = useMemo(
    () =>
      INCIDENT_FILTER_COLUMNS.find((c) => c.field === field) as
        | { field: string; label: string; type: ColumnType; enumValues?: string[] }
        | undefined,
    [field]
  );

  // ✅ Hooks TOUJOURS au top-level (jamais dans un if/switch)
  const [personnes, setPersonnes] = useState<PersonneItem[]>([]);
  const [loadingPersonnes, setLoadingPersonnes] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!col || col.type !== "personneSelect") return;

      try {
        setLoadingPersonnes(true);
        const list = await (api as any).getPersonnes();

        // Supporte: array direct OU { data: [...] }
        const rows: any[] = Array.isArray(list) ? list : Array.isArray(list?.data) ? list.data : [];

        if (!cancelled) setPersonnes(rows as PersonneItem[]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setPersonnes([]);
      } finally {
        if (!cancelled) setLoadingPersonnes(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [col?.type, col?.field]);

  if (!col) return null;

  const opMeta = OPERATORS_BY_TYPE[col.type].find((x) => x.op === op);
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

    return (
      <SiteSelectInput value={value} onChange={onChange} placeholder="Choisir un site…" />
    );
  }

  // =============================
  // ✅ PERSONNE SELECT (corrigé)
  // =============================
  if (col.type === "personneSelect") {
    if (loadingPersonnes) {
      return <div className="text-xs text-slate-500 italic px-2">Chargement…</div>;
    }

    const getPersonLabel = (p: PersonneItem) =>
      p.fullname ?? p.fullName ?? p.username ?? `#${p.id}`;

    if (op === "in") {
      const v: number[] = Array.isArray(value) ? value : [];

      return (
        <select
          multiple
          className="h-24 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          value={v.map(String)}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const selected = Array.from(e.target.selectedOptions)
              .map((option) => Number(option.value))
              .filter(Number.isFinite);

            onChange(selected);
          }}
        >
          {personnes.map((p) => (
            <option key={p.id} value={p.id}>
              {getPersonLabel(p)}
            </option>
          ))}
        </select>
      );
    }

    // ✅ important: value contrôlé
    const selected = value == null ? "" : String(value);

    return (
      <select
        className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={selected}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(undefined);
          onChange(Number(v));
        }}
      >
        <option value="" disabled>
          Choisir…
        </option>
        {personnes.map((p) => (
          <option key={p.id} value={p.id}>
            {getPersonLabel(p)}
          </option>
        ))}
      </select>
    );
  }

  // ENUM
  if (col.type === "enum") {
    const enumValues = (col as any).enumValues as string[] | undefined;

    // ✅ CAS SPÉCIAL: STATUT
    if (field === "status") {
      const statusOptions: ReadonlyArray<StatusOption> = STATUS_OPTIONS;

      if (op === "in") {
        const v: string[] = Array.isArray(value) ? value.map(String) : [];

        const unknown = v.filter((x) => !statusOptions.some((o) => o.value === x));
        const merged = [...statusOptions.map((o) => o.value), ...unknown];

        return (
          <select
            multiple
            className="h-24 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={v}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
              onChange(selected);
            }}
          >
            {merged.map((dbVal) => (
              <option key={dbVal} value={dbVal}>
                {getStatusLabel(dbVal)}
              </option>
            ))}
          </select>
        );
      }

      const selected = value == null ? "" : String(value);
      const hasKnown = statusOptions.some((o) => o.value === selected);
      const showUnknownOption = selected !== "" && !hasKnown;

      return (
        <select
          className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Choisir…
          </option>

          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}

          {showUnknownOption && <option value={selected}>{getStatusLabel(selected)}</option>}
        </select>
      );
    }

    // ENUM générique (inchangé)
    if (op === "in") {
      const v: string[] = Array.isArray(value) ? value : [];
      return (
        <input
          className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          placeholder="ex: OPEN,IN_PROGRESS"
          value={v.join(",")}
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      );
    }

    return (
      <select
        className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Choisir…
        </option>
        {enumValues?.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
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
        <option value="" disabled>
          Choisir…
        </option>
        <option value="true">Vrai</option>
        <option value="false">Faux</option>
      </select>
    );
  }

  // NUMBER
  if (col.type === "number") {
    if (op === "between") {
      const v: [number | "", number | ""] =
        Array.isArray(value) && value.length >= 2 ? [value[0] ?? "", value[1] ?? ""] : ["", ""];
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
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map(Number)
                .filter((n) => Number.isFinite(n))
            )
          }
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
      const v: [string | "", string | ""] =
        Array.isArray(value) && value.length >= 2 ? [value[0] ?? "", value[1] ?? ""] : ["", ""];
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
