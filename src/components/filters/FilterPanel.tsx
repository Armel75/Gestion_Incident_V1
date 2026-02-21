import React, { useMemo } from "react";
import type { FilterRowState, Logic } from "./types";
import { FilterRow } from "./FilterRow";
import { Plus } from "lucide-react";
import { INCIDENT_FILTER_COLUMNS, OPERATORS_BY_TYPE } from "../../constants/incidentFilterColumns";

type Props = {
  open: boolean;
  logic: Logic;
  rows: FilterRowState[];
  onClose: () => void;
  onChangeLogic: (l: Logic) => void;
  onChangeRows: (rows: FilterRowState[]) => void;
  onReset: () => void;
  onApply: () => void;
};

export const FilterPanel: React.FC<Props> = ({
  open, logic, rows, onClose, onChangeLogic, onChangeRows, onReset, onApply
}) => {
  const canAdd = rows.length < 10;

  const addRow = () => {
    const first = INCIDENT_FILTER_COLUMNS[0];
    const op = OPERATORS_BY_TYPE[first.type][0].op;
    onChangeRows([...rows, { id: crypto.randomUUID(), field: first.field as any, op, value: undefined }]);
  };

  const hasRows = rows.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[720px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl p-4 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">Filtres</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Ajoute des critères, puis clique sur Appliquer.</div>
          </div>
          <button
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        {/* Logic */}
        <div className="pt-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Logique</div>
          <select
            className="h-8 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
            value={logic}
            onChange={(e) => onChangeLogic(e.target.value as Logic)}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>

        {/* Rows */}
        <div className="pt-4 flex-1 overflow-auto">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Critères</div>

          <div className="flex flex-col gap-3">
            {rows.map((r, idx) => (
              <FilterRow
                key={r.id}
                row={r}
                onChange={(next) => {
                  const copy = rows.slice();
                  copy[idx] = next;
                  onChangeRows(copy);
                }}
                onRemove={() => onChangeRows(rows.filter(x => x.id !== r.id))}
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
            {!canAdd && (
              <div className="text-xs text-slate-500 mt-2">Limite: 10 filtres.</div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
            onClick={onReset}
            disabled={!hasRows}
          >
            Réinitialiser
          </button>

          <button
            className="h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium"
            onClick={onApply}
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};