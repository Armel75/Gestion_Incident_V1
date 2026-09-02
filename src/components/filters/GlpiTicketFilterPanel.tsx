import React, { useMemo } from "react";
import type { Logic } from "./types";
import { OPERATORS_BY_TYPE } from "../../constants/incidentFilterColumns";
import {
  GLPI_TICKET_FILTER_COLUMNS,
  glpiEnumLabel,
} from "../../constants/glpiTicketFilterColumns";
import type { GlpiFilterRowState, GlpiFilterColumn } from "../../constants/glpiTicketFilterColumns";
import { Plus, XCircle } from "lucide-react";

const makeId = (): string => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

/* ─────────── Champ de valeur (self-contained, propre aux tickets GLPI) ─────────── */
const GlpiValueInput: React.FC<{
  col: GlpiFilterColumn;
  op: string;
  value: any;
  onChange: (v: any) => void;
}> = ({ col, op, value, onChange }) => {
  const opMeta = OPERATORS_BY_TYPE[col.type].find((x) => x.op === op);
  const needsValue = opMeta?.needsValue ?? true;
  if (!needsValue) return <div className="text-xs text-slate-500 italic px-2">—</div>;

  // ── ENUM (statut / priorité / urgence / impact) ──
  if (col.type === "enum") {
    const options = (col.enumValues ?? []).map((v) => ({
      value: v,
      label: glpiEnumLabel(col.field, v),
    }));

    if (op === "in") {
      const v: string[] = Array.isArray(value) ? value.map(String) : [];
      return (
        <select
          multiple
          className="h-24 w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          value={v}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange(Array.from(e.target.selectedOptions).map((o) => o.value))
          }
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    const selected = value == null ? "" : String(value);
    return (
      <select
        className="h-8 w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Choisir…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  // ── DATE / DATETIME ──
  if (col.type === "date" || col.type === "datetime") {
    if (op === "between") {
      const v: string[] = Array.isArray(value) && value.length >= 2 ? value.map(String) : ["", ""];
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={v[0]}
            onChange={(e) => onChange([e.target.value, v[1]])}
          />
          <span className="text-xs text-slate-500">et</span>
          <input
            type="date"
            className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={v[1]}
            onChange={(e) => onChange([v[0], e.target.value])}
          />
        </div>
      );
    }

    const selected = value == null ? "" : String(value);
    return (
      <input
        type="date"
        className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // ── NUMBER (ID ticket) ──
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
          className="h-8 w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
          placeholder="ex: 1,2,3"
          value={v.join(",")}
          onChange={(e) =>
            onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean).map(Number))
          }
        />
      );
    }
    return (
      <input
        type="number"
        className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }

  // ── STRING (défaut) ──
  return (
    <input
      className="h-8 w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
      placeholder="Valeur…"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

/* ─────────── Ligne de filtre ─────────── */
const GlpiFilterRow: React.FC<{
  row: GlpiFilterRowState;
  onChange: (next: GlpiFilterRowState) => void;
  onRemove: () => void;
}> = ({ row, onChange, onRemove }) => {
  const col =
    GLPI_TICKET_FILTER_COLUMNS.find((c) => c.field === row.field) ??
    GLPI_TICKET_FILTER_COLUMNS[0];
  const ops = useMemo(() => OPERATORS_BY_TYPE[col.type], [col.type]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-8 w-48 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={row.field}
        onChange={(e) => {
          const nextField = e.target.value as GlpiFilterRowState["field"];
          const nextCol = GLPI_TICKET_FILTER_COLUMNS.find((c) => c.field === nextField)!;
          onChange({
            ...row,
            field: nextField,
            op: OPERATORS_BY_TYPE[nextCol.type][0].op as any,
            value: undefined,
          });
        }}
      >
        {GLPI_TICKET_FILTER_COLUMNS.map((c) => (
          <option key={c.field} value={c.field}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        className="h-8 w-44 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={row.op}
        onChange={(e) => onChange({ ...row, op: e.target.value as any, value: undefined })}
      >
        {ops.map((o) => (
          <option key={o.op} value={o.op}>
            {o.label}
          </option>
        ))}
      </select>

      <GlpiValueInput
        col={col}
        op={row.op}
        value={row.value}
        onChange={(v) => onChange({ ...row, value: v })}
      />

      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Supprimer"
      >
        <XCircle className="h-5 w-5" />
      </button>
    </div>
  );
};

/* ─────────── Panneau ─────────── */
type Props = {
  open: boolean;
  logic: Logic;
  rows: GlpiFilterRowState[];
  onClose: () => void;
  onChangeLogic: (l: Logic) => void;
  onChangeRows: (rows: GlpiFilterRowState[]) => void;
  onReset: () => void;
  onApply: () => void;
  isQueryLoading?: boolean;
};

export const GlpiTicketFilterPanel: React.FC<Props> = ({
  open,
  logic,
  rows,
  onClose,
  onChangeLogic,
  onChangeRows,
  onReset,
  onApply,
  isQueryLoading = false,
}) => {
  const canAdd = rows.length < 10;
  const hasRows = rows.length > 0;

  if (!open) return null;

  const addRow = () => {
    const first = GLPI_TICKET_FILTER_COLUMNS[0];
    onChangeRows([
      ...rows,
      { id: makeId(), field: first.field, op: OPERATORS_BY_TYPE[first.type][0].op as any },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[720px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl p-4 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Filtrer les tickets GLPI
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Ajoute des critères (sur toutes les colonnes), puis clique sur Appliquer. Le filtrage
              s’applique sur l’ensemble des tickets, pas seulement la page affichée.
            </div>
          </div>
          <button
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        {/* Logique */}
        <div className="pt-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Logique</div>
          <select
            className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={logic}
            onChange={(e) => onChangeLogic(e.target.value as Logic)}
          >
            <option value="AND">ET (tous les critères)</option>
            <option value="OR">OU (au moins un critère)</option>
          </select>
        </div>

        {/* Critères */}
        <div className="pt-4 flex-1 overflow-auto">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Critères</div>

          <div className="flex flex-col gap-3">
            {rows.map((r, idx) => (
              <GlpiFilterRow
                key={r.id}
                row={r}
                onChange={(next) => {
                  const copy = rows.slice();
                  copy[idx] = next;
                  onChangeRows(copy);
                }}
                onRemove={() => onChangeRows(rows.filter((x) => x.id !== r.id))}
              />
            ))}
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={addRow}
              disabled={!canAdd}
              className="h-8 px-3 rounded-md bg-slate-900 dark:bg-brand-600 text-white text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Ajouter un filtre
            </button>
            {!canAdd && <div className="text-xs text-slate-500 mt-2">Limite : 10 filtres.</div>}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
            onClick={onReset}
            disabled={!hasRows || isQueryLoading}
          >
            Réinitialiser
          </button>

          <button
            className="h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50"
            onClick={onApply}
            disabled={isQueryLoading}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlpiTicketFilterPanel;
