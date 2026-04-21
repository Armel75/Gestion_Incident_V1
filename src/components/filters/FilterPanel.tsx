import React, { useState } from "react";
import type { FilterRowState, Logic } from "./types";
import { FilterRow } from "./FilterRow";
import { Plus, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { INCIDENT_FILTER_COLUMNS, OPERATORS_BY_TYPE } from "../../constants/incidentFilterColumns";
import type { QueryPayload } from "./serialize";
import { api } from "@/services/api";

const makeId = (): string => {
  // 1) si dispo (HTTPS / localhost / navigateurs récents)
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  // 2) fallback sécurisé via getRandomValues (marche en HTTP)
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    // UUID v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // 3) dernier recours
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

type Props = {
  open: boolean;
  logic: Logic;
  rows: FilterRowState[];
  onClose: () => void;
  onChangeLogic: (l: Logic) => void;
  onChangeRows: (rows: FilterRowState[]) => void;
  onReset: () => void;
  onApply: () => void;

  // ✅ AJOUTS (compatibles)
  appliedPayload?: QueryPayload | null;
  isQueryLoading?: boolean;
  totalCount?: number; // optionnel
};

export const FilterPanel: React.FC<Props> = ({
  open,
  logic,
  rows,
  onClose,
  onChangeLogic,
  onChangeRows,
  onReset,
  onApply,
  appliedPayload = null,
  isQueryLoading = false,
  totalCount,
}) => {
  const canAdd = rows.length < 10;
  const hasRows = rows.length > 0;

  const [exporting, setExporting] = useState<null | "pdf" | "excel">(null);

  const exportEnabled =
    !!appliedPayload &&
    !isQueryLoading &&
    exporting === null &&
    // si totalCount est fourni, on peut bloquer à 0, sinon on laisse passer
    (typeof totalCount === "number" ? totalCount > 0 : true);

  const addRow = () => {
    const first = INCIDENT_FILTER_COLUMNS[0];
    const op = OPERATORS_BY_TYPE[first.type][0].op;
    onChangeRows([
      ...rows,
      { id: makeId(), field: first.field as any, op, value: undefined },
    ]);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onExport = async (format: "pdf" | "excel") => {
    if (!appliedPayload) return;

    try {
      setExporting(format);

      // ✅ log pour vérifier que c’est bien le payload appliqué
      console.log("[EXPORT payload]", appliedPayload);

      const date = new Date().toISOString().slice(0, 10);

      // ⚠️ IMPORTANT:
      // - si ton backend renvoie CSV => extension .csv
      // - si tu renvoies un vrai XLSX => mets .xlsx
      // Ici je pars sur CSV (le plus probable sans librairie Excel).
      const filename =
        format === "pdf" ? `incidents_${date}.pdf` : `incidents_${date}.csv`;

      const blob =
        format === "pdf"
          ? await (api as any).exportIncidentsPdf(appliedPayload)
          : await (api as any).exportIncidentsExcel(appliedPayload);

      downloadBlob(blob, filename);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || `Erreur export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

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
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Ajoute des critères, puis clique sur Appliquer.
            </div>
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
            <option value="AND">ET</option>
            <option value="OR">OU</option>
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
            {!canAdd && <div className="text-xs text-slate-500 mt-2">Limite: 10 filtres.</div>}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm"
            onClick={onReset}
            disabled={!hasRows || isQueryLoading || exporting !== null}
          >
            Réinitialiser
          </button>

          <div className="flex items-center gap-2">
            {/* ✅ Export PDF */}
            <button
              type="button"
              disabled={!exportEnabled}
              onClick={() => onExport("pdf")}
              className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              title={!appliedPayload ? "Applique d'abord les filtres" : "Télécharger PDF"}
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Télécharger PDF
            </button>

            {/* ✅ Export EXCEL (CSV) */}
            <button
              type="button"
              disabled={!exportEnabled}
              onClick={() => onExport("excel")}
              className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              title={!appliedPayload ? "Applique d'abord les filtres" : "Télécharger Excel"}
            >
              {exporting === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Télécharger EXCEL
            </button>

            {/* ✅ Apply (inchangé) */}
            <button
              className="h-8 px-4 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50"
              onClick={onApply}
              disabled={isQueryLoading || exporting !== null}
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};