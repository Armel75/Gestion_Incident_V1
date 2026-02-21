import React, { useMemo } from "react";
import { INCIDENT_FILTER_COLUMNS, OPERATORS_BY_TYPE } from "../../constants/incidentFilterColumns";
import { ValueInput } from "./ValueInput";
import type { FilterRowState } from "./types";
import { XCircle } from "lucide-react";

type Props = {
  row: FilterRowState;
  onChange: (next: FilterRowState) => void;
  onRemove: () => void;
};

export const FilterRow: React.FC<Props> = ({ row, onChange, onRemove }) => {
  const col = INCIDENT_FILTER_COLUMNS.find(c => c.field === row.field) ?? INCIDENT_FILTER_COLUMNS[0];
  const ops = useMemo(() => OPERATORS_BY_TYPE[col.type], [col.type]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Column */}
      <select
        className="h-8 w-48 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={row.field}
        onChange={(e) => {
          const nextField = e.target.value as any;
          const nextCol = INCIDENT_FILTER_COLUMNS.find(c => c.field === nextField)!;
          const defaultOp = OPERATORS_BY_TYPE[nextCol.type][0].op;
          onChange({ ...row, field: nextField, op: defaultOp, value: undefined });
        }}
      >
        {INCIDENT_FILTER_COLUMNS.map(c => (
          <option key={c.field} value={c.field}>{c.label}</option>
        ))}
      </select>

      {/* Operator */}
      <select
        className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
        value={row.op}
        onChange={(e) => onChange({ ...row, op: e.target.value as any, value: undefined })}
      >
        {ops.map(o => (
          <option key={o.op} value={o.op}>{o.label}</option>
        ))}
      </select>

      {/* Value */}
      <ValueInput
        field={row.field}
        op={row.op}
        value={row.value}
        onChange={(v) => onChange({ ...row, value: v })}
      />

      {/* Remove */}
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