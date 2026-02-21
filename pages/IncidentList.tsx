import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Incident } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../components/ui/Badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  XCircle,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Loader2,
  Filter as FilterIcon,
} from "lucide-react";
import { useAuth } from "../src/types/auth/AuthContext";

// ✅ Filter Builder (doit exister dans ton projet selon l’intégration convenue)
import { FilterPanel } from "../src/components/filters/FilterPanel";
import type { FilterRowState, Logic } from "../src/components/filters/types";
import { serializeToPayload } from "../src/components/filters/serialize";


type AppliedQuery = {
  logic: Logic;
  rows: FilterRowState[];
  sort: { field: string; dir: "asc" | "desc" }[];
  page: number;
  pageSize: number;
  tz: string;
};

export const IncidentList: React.FC<{ mode?: "normal" | "archives" }> = ({ mode = "normal" }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status"); // conserve la logique existante via URL
  const { user, isLoading: authLoading } = useAuth();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [totalPages, setTotalPages] = useState(1);

  // -----------------------------
  // ✅ Filter Builder state
  // -----------------------------
  const [filterOpen, setFilterOpen] = useState(false);

  const [draftLogic, setDraftLogic] = useState<Logic>("AND");
  const [draftRows, setDraftRows] = useState<FilterRowState[]>([]);

  // const [appliedLogic, setAppliedLogic] = useState<Logic>("AND");
  // const [appliedRows, setAppliedRows] = useState<FilterRowState[]>([]);
  // const [currentPage, setCurrentPage] = useState(1);
  const requestSeq = React.useRef(0);
  const PAGE_SIZE = 10;

  const [appliedQuery, setAppliedQuery] = useState<AppliedQuery>({
    logic: "AND",
    rows: [],
    sort: [{ field: "createdAt", dir: "desc" }],
    page: 1,
    pageSize: PAGE_SIZE,
    tz: "Africa/Douala",
  });

  const filtersActive = appliedQuery.rows.length > 0 || !!statusFilter;

  useEffect(() => {
    if (authLoading) return;
    fetchIncidents(appliedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, JSON.stringify(appliedQuery), statusFilter, mode]);

  const fetchIncidents = async (query: AppliedQuery) => {
    const seq = ++requestSeq.current;
    setLoading(true);

    try {
      const payload = serializeToPayload({
        logic: query.logic,
        rows: query.rows,
        page: query.page,
        pageSize: query.pageSize,
        tz: query.tz,
        // IMPORTANT: pour l’instant serializeToPayload force createdAt desc chez toi,
        // on garde ça en attendant l’étape tri (plus tard).
      });


      // ✅ Mode ARCHIVES : uniquement CLOSED + CANCELLED
      if (mode === "archives") {
        // on retire toute éventuelle règle "status" déjà présente
        payload.filters = payload.filters.filter((f) => f.field !== "status");

        payload.filters.push({
          field: "status",
          op: "in",
          value: ["CLOSED", "CANCELLED"],
        });
      } else {
        // ✅ Mode NORMAL : exclure CLOSED + CANCELLED par défaut
        // Si l’URL impose un status (?status=OPEN), on le respecte.
        payload.filters = payload.filters.filter((f) => f.field !== "status");

        if (statusFilter) {
          payload.filters.push({ field: "status", op: "eq", value: statusFilter });
        } else {
          // IMPORTANT: nécessite que ton backend supporte "notIn"
          payload.filters.push({
            field: "status",
            op: "notIn",
            value: ["CLOSED", "CANCELLED"],
          });
        }
      }

      console.log("[FETCH payload]", payload);

      const result = await (api as any).queryIncidents(payload);

      // Si une autre requête plus récente est partie, on ignore celle-ci
      if (seq !== requestSeq.current) return;

      const mappedData = result.data.map((inc: any) => ({
        ...inc,
        reference: `INC-${new Date(inc.createdAt).getFullYear()}-${String(inc.id).padStart(3, "0")}`,
        title: inc.description,
        priority: inc.urgency,
        service: "",
        serviceEmitter: inc.serviceEmitter,
      }));

      setIncidents(mappedData);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  // ✅ Reset global (URL + filtres builder)
  const clearFilter = () => {
    setSearchParams({});
    setDraftLogic("AND");
    setDraftRows([]);

    setAppliedQuery({
      logic: "AND",
      rows: [],
      sort: [{ field: "createdAt", dir: "desc" }],
      page: 1,
      pageSize: PAGE_SIZE,
      tz: "Africa/Douala",
    });
  };

  const applyFilters = () => {
      setAppliedQuery((prev) => ({
        ...prev,
        logic: draftLogic,
        rows: draftRows,
        page: 1, // ✅ reset page
      }));

    setFilterOpen(false);
  };
  
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = (e: React.MouseEvent, incident: any) => {
    e.stopPropagation();

    const formatValue = (value: any) => {
      if (value === null || value === undefined) return "";
      if (value instanceof Date) {
        return value.toLocaleDateString("fr-FR");
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    };

    const rows = [
      ["Référence", "Description", "Statut", "Priorité", "Sites", "Créé le"],
      [
        incident.reference,
        incident.description,
        incident.status,
        incident.urgency,
        incident.sites?.map((s: any) => s.name).join(", ") ?? "",
        new Date(incident.createdAt),
      ],
    ];

    const csvContent = rows.map((row) => row.map(formatValue).join(";")).join("\n");

    downloadFile(csvContent, `incident_${incident.reference}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportPDF = async (e: React.MouseEvent, incident: any) => {
    e.stopPropagation();

    try {
      setDownloadingId(incident.id);

      const pdfBlob = await (api as any).getIncidentReportPdf(incident.id);

      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `FICHE_INCIDENT_${incident.reference}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Impossible de générer le PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCloseIncident = async (e: React.MouseEvent, incident: any) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Confirmez-vous la clôture définitive de l'incident ${incident.reference} ?`
    );
    if (!confirmed) return;

    try {
      const formData = new FormData();
      formData.append("status", "CLOSED");

      await (api as any).updateIncident(incident.id, formData);

      fetchIncidents(appliedQuery);
    } catch (error) {
      console.error("Erreur lors de la clôture de l’incident", error);
      alert("Impossible de clôturer l'incident");
    }
  };

  const urgencyToPriority = (urgency: Incident["urgency"]) => {
    switch (urgency) {
      case "Faible":
        return "LOW";
      case "Moyenne":
        return "MEDIUM";
      case "Haute":
        return "HIGH";
      case "Immédiate":
        return "CRITICAL";
      default:
        return "LOW";
    }
  };

  // ✅ Si jamais tu veux afficher des incidents même en fallback, on garde incidents tel quel
  const displayedIncidents = useMemo(() => incidents, [incidents]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            Incidents
          </h1>

          {filtersActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/50 px-2 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-700/10">
              Filtres actifs
              <button
                onClick={clearFilter}
                className="text-brand-600 hover:text-brand-900 dark:hover:text-white"
                title="Effacer les filtres"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* ✅ Remplace complètement le champ 'Filtrer...' */}
          <button
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            onClick={() => setFilterOpen(true)}
          >
            <FilterIcon className="h-4 w-4 text-slate-500" />
            Filtres
          </button>

          <button
            className="h-8 pl-2 pr-3 bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white rounded-md text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all"
            onClick={() => navigate("/incidents/new")}
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </button>
        </div>
      </div>

      {/* ✅ Filter Builder Panel */}
      <FilterPanel
        open={filterOpen}
        logic={draftLogic}
        rows={draftRows}
        onClose={() => setFilterOpen(false)}
        onChangeLogic={setDraftLogic}
        onChangeRows={setDraftRows}
        onReset={() => {
          setDraftLogic("AND");
          setDraftRows([]);
        }}
        onApply={applyFilters}
      />

      {/* Table Container */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
        {loading || authLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Chargement des données...
            </p>
          </div>
        ) : displayedIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <p>Aucun incident trouvé.</p>
            {filtersActive && (
              <button
                onClick={clearFilter}
                className="mt-2 text-sm text-brand-600 hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32"
                >
                  Statut
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-28"
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                    Priorité <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell"
                >
                  Service émetteur
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell"
                >
                  Service traitant
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell"
                >
                  Assigné
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[280px]"
                ></th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
              {displayedIncidents.map((incident: any) => (
                <tr
                  key={incident.id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                >
                  <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {incident.reference}
                  </td>

                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {incident.title}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1 md:hidden">
                      {new Date(incident.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    <StatusBadge status={incident.status} />
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    <PriorityBadge
                      priority={urgencyToPriority(incident.urgency)}
                      showLabel={true}
                    />
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    {incident.serviceEmitter ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                      bg-blue-100 dark:bg-blue-900/40
                                      text-blue-700 dark:text-blue-300"
                      >
                        {incident.serviceEmitter}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {incident.sites && incident.sites.length > 0 ? (
                        incident.sites.map((site: any) => (
                          <span
                            key={site.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                      bg-slate-100 dark:bg-slate-800
                                      text-slate-600 dark:text-slate-300"
                          >
                            {site.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    {incident.personnes && incident.personnes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {incident.personnes.map((personne: any) => (
                          <div key={personne.id} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-bold border border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                              {personne.fullname.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {personne.fullname}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleExportPDF(e, incident)}
                        disabled={downloadingId === incident.id}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                        title="Exporter en PDF"
                      >
                        {downloadingId === incident.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Génération...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 text-red-500" />
                            <span>Export PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleExportExcel(e, incident)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded transition-colors dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/50"
                        title="Exporter en Excel"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                      </button>

                      {incident.status !== "CLOSED" &&
                        incident.status !== "CANCELLED" &&
                        Number(user?.id) === Number(incident.reporterId) && (
                          <button
                            onClick={(e) => handleCloseIncident(e, incident)}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                            title="Clôturer l'incident"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Clôturer
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Pagination */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Page{" "}
          <span className="font-medium text-slate-900 dark:text-white">{appliedQuery.page}</span>{" "}
          sur{" "}
          <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAppliedQuery((q) => ({ ...q, page: Math.max(q.page - 1, 1) }))}
            disabled={appliedQuery.page}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setAppliedQuery((q) => ({ ...q, page: Math.min(q.page + 1, totalPages) }))}
            disabled={appliedQuery.page === totalPages}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};