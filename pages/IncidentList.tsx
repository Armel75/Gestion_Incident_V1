
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Incident } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "../components/ui/Badge";
import {
  Plus,
  ArrowUpDown,
  XCircle,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Loader2,
  Info,
  Filter as FilterIcon,
  PieChart,
  BarChart2,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { useAuth } from "../src/types/auth/AuthContext";

// ✅ Filter Builder (doit exister dans ton projet selon l’intégration convenue)
import { FilterPanel } from "../src/components/filters/FilterPanel";
import type { FilterRowState, Logic } from "../src/components/filters/types";
import { serializeToPayload } from "../src/components/filters/serialize";
import type { QueryPayload } from "../src/components/filters/serialize";

type AppliedQuery = {
  logic: Logic;
  rows: FilterRowState[];
  sort: { field: string; dir: "asc" | "desc" }[];
  page: number;
  pageSize: number;
  tz: string;
};

export const IncidentList: React.FC<{ mode?: "normal" | "archives" }> = ({ mode = "normal" }) => {
    // --- Ajout bouton rouvrir incident pour archives ---
    const [reopenLoadingId, setReopenLoadingId] = useState<string | null>(null);
    const canReopenIncident = (incident: any) =>
      mode === "archives" && (incident.status === "CLOSED" || incident.status === "CANCELLED");

    const handleReopenIncident = async (e: React.MouseEvent, incident: any) => {
      e.stopPropagation();
      if (!window.confirm("Voulez-vous vraiment rouvrir cet incident ?")) return;
      setReopenLoadingId(incident.id);
      try {
        await api.reopenIncident(incident.id);
        await fetchIncidents(appliedQuery);
      } catch (err: any) {
        alert(err?.message || "Erreur lors de la réouverture de l’incident.");
      } finally {
        setReopenLoadingId(null);
      }
    };
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedPayload, setAppliedPayload] = useState<QueryPayload | null>(null);
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

  const requestSeq = React.useRef(0);
  const PAGE_SIZE = 10;

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<any | null>(null);
  const [closeComment, setCloseComment] = useState("");
  const [closing, setClosing] = useState(false);

  const [appliedQuery, setAppliedQuery] = useState<AppliedQuery>({
    logic: "AND",
    rows: [],
    sort: [{ field: "createdAt", dir: "desc" }],
    page: 1,
    pageSize: PAGE_SIZE,
    tz: "Africa/Douala",
  });

  const openCloseModal = (e: React.MouseEvent, incident: any) => {
    e.stopPropagation();
    setCloseTarget(incident);
    setCloseComment("");
    setCloseModalOpen(true);
  };

  const submitClose = async () => {
    if (!closeTarget) return;

    const trimmed = closeComment.trim();
    if (trimmed.length < 3) {
      alert("Le commentaire de clôture est obligatoire (min 3 caractères).");
      return;
    }

    try {
      setClosing(true);
      // ✅ backend attend "content"
      await (api as any).closeIncident(closeTarget.id, { content: trimmed });

      setCloseModalOpen(false);
      setCloseTarget(null);
      setCloseComment("");

      fetchIncidents(appliedQuery);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Impossible de clôturer l'incident");
    } finally {
      setClosing(false);
    }
  };

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

      // ✅ immuable au moment du clic
      setAppliedPayload(payload);

      // ✅ Si le Filter Builder a déjà un filtre status, on ne l'écrase PAS.
      const hasStatusFromBuilder = payload.filters.some((f) => f.field === "status");

      if (mode === "archives") {
        // En archives, on force CLOSED/CANCELLED uniquement si l'utilisateur n'a pas choisi un status explicitement.
        if (!hasStatusFromBuilder) {
          payload.filters.push({
            field: "status",
            op: "in",
            value: ["CLOSED", "CANCELLED"],
          });
        }
      } else {
        // Mode normal :
        // - si l'URL impose un status, elle est prioritaire
        // - sinon, si le builder a un status, on le respecte
        // - sinon, on applique le notIn par défaut
        if (statusFilter) {
          payload.filters = payload.filters.filter((f) => f.field !== "status");
          payload.filters.push({ field: "status", op: "eq", value: statusFilter });
        } else if (!hasStatusFromBuilder) {
          payload.filters.push({
            field: "status",
            op: "notIn",
            value: ["CLOSED", "CANCELLED"],
          });
        }
      }

      const result = await (api as any).queryIncidents(payload);

      // Si une autre requête plus récente est partie, on ignore celle-ci
      if (seq !== requestSeq.current) return;

      const mappedData = result.data.map((inc: any) => ({
        ...inc,
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
    setAppliedPayload(null);
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
    const BOM = "\uFEFF";

    const blob = new Blob([BOM + content], {
      type: `${mimeType};charset=utf-8;`,
    });

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

    const sep = ";";

    const csvEscape = (value: any) => {
      const s = String(value ?? "");
      return `"${s.replace(/"/g, '""')}"`;
    };

    const createdAt = incident.createdAt
      ? new Date(incident.createdAt).toLocaleDateString("fr-FR")
      : "";

    const dueDate = incident.dueDate
      ? new Date(incident.dueDate).toLocaleDateString("fr-FR")
      : "";

    const sites =
      Array.isArray(incident.sites) && incident.sites.length
        ? incident.sites.map((s: any) => s.name).join(", ")
        : "";

    const glpiTicketNumber = incident.glpiTicketId ? String(incident.glpiTicketId) : "";

    const rows = [
      [
        "Nom du déclarant",
        "Ticket GLPI",
        "Référence",
        "Description",
        "Cause racine",
        "Solution proposée",
        "Statut",
        "Priorité",
        "Service émetteur",
        "Site récepteur",
        "Créé le",
        "Échéance",
      ],
      [
        incident.reporterName ?? "",
        glpiTicketNumber,
        incident.reference,
        incident.description,
        incident.rootCause ?? "",
        incident.proposedSolution ?? "",
        incident.status,
        incident.urgency,
        incident.serviceEmitter ?? "",
        sites,
        createdAt,
        dueDate,
      ],
    ];

    const csvContent = rows
      .map((row) => row.map(csvEscape).join(sep))
      .join("\n");

    downloadFile(
      csvContent,
      `incident_${incident.reference}.csv`,
      "text/csv"
    );
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

  // Correction : supporte roles sous forme de string[] ou d'objets { name }
  const userRoles: string[] = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as any[]).map((r) => typeof r === "string" ? r : r.name)
    : (user as any)?.role
      ? [String((user as any).role)]
      : [];

  const isControleur = userRoles.includes("CONTROLEUR");

  const canCloseIncident = (incident: any) => {
    const isAlreadyClosed = incident.status === "CLOSED" || incident.status === "CANCELLED";
    if (isAlreadyClosed) return false;

    const isReporter = Number(user?.id) === Number(incident.reporterId);

    // ✅ Déclarant OU contrôleur
    return isReporter || isControleur;
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Action Bar */}
      <div className="flex flex-col px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
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

          <button
            className="h-8 pl-2 pr-3 bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 text-white rounded-md text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all"
            onClick={() => navigate("/incidents/new")}
          >
            <Plus className="h-4 w-4" />
            Nouvel Incident
          </button>
        </div>

        <div className="flex items-stretch gap-3">
          {/* Navigation Pilotage */}
          <button
            className="group flex-1 flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:shadow-md"
            onClick={() => navigate("/pilotage")}
          >
            <div className="flex items-center gap-2 w-full">
              <PieChart className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm font-semibold">Pilotage des incidents</span>
              <ChevronRight className="h-4 w-4 text-amber-400/60 ml-auto group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70 ml-7">
              Piloter les catégories et les processus, et suivre les signaux de risque de vos incidents
            </span>
            <div className="mt-1.5 ml-7 w-[calc(100%-28px)] rounded-lg bg-amber-500 dark:bg-amber-600 border border-amber-600 dark:border-amber-700 px-2.5 py-1.5 text-xs font-semibold text-white flex items-center justify-between gap-1.5 group-hover:bg-amber-600 dark:group-hover:bg-amber-700 group-hover:border-amber-700 dark:group-hover:border-amber-800 transition-all duration-200">
              <span>Cliquer pour voir</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>

          {/* Navigation Rapports */}
          <button
            className="group flex-1 flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:shadow-md"
            onClick={() => navigate("/reports")}
          >
            <div className="flex items-center gap-2 w-full">
              <BarChart2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-semibold">Rapports hebdomadaires</span>
              <ChevronRight className="h-4 w-4 text-emerald-400/60 ml-auto group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70 ml-7">
              Consulter et générer un rapport hebdomadaire de vos incidents
            </span>
            <div className="mt-1.5 ml-7 w-[calc(100%-28px)] rounded-lg bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white flex items-center justify-between gap-1.5 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-700 group-hover:border-emerald-700 dark:group-hover:border-emerald-800 transition-all duration-200">
              <span>Cliquer pour voir</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>

          {/* Filtre */}
          <button
            className="group flex-1 flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/40 hover:shadow-md"
            onClick={() => setFilterOpen(true)}
          >
            <div className="flex items-center gap-2 w-full">
              <FilterIcon className="h-5 w-5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
              <span className="text-sm font-semibold">Cliquer &amp; Filtrer les incidents</span>
              <ChevronRight className="h-4 w-4 text-sky-400/60 ml-auto group-hover:text-sky-600 dark:group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="text-[11px] font-medium text-sky-600/70 dark:text-sky-400/70 ml-7">
              Filtrer et rechercher des incidents par critères avancés
            </span>
            <div className="mt-1.5 ml-7 w-[calc(100%-28px)] rounded-lg bg-sky-500 dark:bg-sky-600 border border-sky-600 dark:border-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white flex items-center justify-between gap-1.5 group-hover:bg-sky-600 dark:group-hover:bg-sky-700 group-hover:border-sky-700 dark:group-hover:border-sky-800 transition-all duration-200">
              <span>Cliquer pour filtrer</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </button>

          {/* Navigation Tickets GLPI */}
          <button
            className="group flex-1 flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left shadow-sm transition-all duration-200 border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/40 hover:shadow-md"
            onClick={() => navigate("/glpi-tickets")}
          >
            <div className="flex items-center gap-2 w-full">
              <Ticket className="h-5 w-5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
              <span className="text-sm font-semibold">Tickets GLPI</span>
              <ChevronRight className="h-4 w-4 text-violet-400/60 ml-auto group-hover:text-violet-600 dark:group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all" />
            </div>
            <span className="text-[11px] font-medium text-violet-600/70 dark:text-violet-400/70 ml-7">
              Consulter et filtrer les tickets GLPI ouverts synchronisés
            </span>
            <div className="mt-1.5 ml-7 w-[calc(100%-28px)] rounded-lg bg-violet-500 dark:bg-violet-600 border border-violet-600 dark:border-violet-700 px-2.5 py-1.5 text-xs font-semibold text-white flex items-center justify-between gap-1.5 group-hover:bg-violet-600 dark:group-hover:bg-violet-700 group-hover:border-violet-700 dark:group-hover:border-violet-800 transition-all duration-200">
              <span>Cliquer pour voir</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
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
        // ✅ AJOUTS
        appliedPayload={appliedPayload}
        isQueryLoading={loading || authLoading}
        totalCount={incidents.length}
      />

      {/* Table Container */}
      <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-900">
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
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40"
                >
                  Export PDF
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40"
                >
                  Cloture incident
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40"
                >
                  Rouvrir l'incident
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40"
                >
                  Option Incident
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40"
                >
                  Details Incident
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40"
                >
                  Déclarant
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Cause racine
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Solution proposée
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
                  Échéance
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

                  <td className="px-6 py-3 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {canCloseIncident(incident) && (
                      <button
                        onClick={(e) => openCloseModal(e, incident)}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                        title="Clôturer l'incident"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Clôturer
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {canReopenIncident(incident) && (
                      <button
                        onClick={(e) => handleReopenIncident(e, incident)}
                        disabled={reopenLoadingId === incident.id}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                        aria-label="Rouvrir l’incident"
                        title="Rouvrir l’incident"
                      >
                        {reopenLoadingId === incident.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Restauration...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 text-blue-500" />
                            <span>Rouvrir l’incident</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/incidents/${incident.id}`);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                      title="Option Incident"
                    >
                      <Info className="h-3.5 w-3.5" /> Modifier Incident
                    </button>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/incidents/${incident.id}`);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                      title="Détails Incident"
                    >
                      <Info className="h-3.5 w-3.5" /> Details Incident
                    </button>
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    {incident.reporterName?.trim() ? (
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {incident.reporterName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
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
                  <td className="px-6 py-3">
                    {incident.rootCause?.trim() ? (
                      <span className="text-xs text-slate-700 dark:text-slate-200">{incident.rootCause}</span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {incident.proposedSolution?.trim() ? (
                      <span className="text-xs text-slate-700 dark:text-slate-200">{incident.proposedSolution}</span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>


                  <td className="px-6 py-3 whitespace-nowrap">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {incident.dueDate ? new Date(incident.dueDate).toLocaleDateString("fr-FR") : "—"}
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
                    {(incident.personnes && incident.personnes.length > 0) || (incident.glpiUsers && incident.glpiUsers.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {incident.personnes && incident.personnes.map((personne: any) => (
                          <div key={"personne-" + personne.id} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-bold border border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                              {personne.fullname.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {personne.fullname}
                            </span>
                          </div>
                        ))}
                        {incident.glpiUsers && incident.glpiUsers.map((user: any) => (
                          <div key={"glpi-" + user.id} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-bold border border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700">
                              {(user.fullname || user.fullName || user.login || "?").substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {user.fullname || user.fullName || user.login || "Utilisateur GLPI"}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${incident.id}`);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                        title="Options incident"
                      >
                        <Info className="h-3.5 w-3.5" /> Options incident
                      </button>

                      {canReopenIncident(incident) && (
                        <button
                          onClick={(e) => handleReopenIncident(e, incident)}
                          disabled={reopenLoadingId === incident.id}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                          aria-label="Rouvrir l’incident"
                          title="Rouvrir l’incident"
                        >
                          {reopenLoadingId === incident.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Restauration...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 text-blue-500" />
                              <span>Rouvrir l’incident</span>
                            </>
                          )}
                        </button>
                      )}
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

                      {canCloseIncident(incident) && (
                        <button
                          //onClick={(e) => handleCloseIncident(e, incident)}
                          onClick={(e) => openCloseModal(e, incident)}
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
            disabled={appliedQuery.page === 1}
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200
                      hover:bg-slate-50 dark:hover:bg-slate-700
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          <button
            onClick={() => setAppliedQuery((q) => ({ ...q, page: Math.min(q.page + 1, totalPages) }))}
            disabled={appliedQuery.page === totalPages}
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200
                      hover:bg-slate-50 dark:hover:bg-slate-700
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      </div>

      {closeModalOpen && closeTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            if (!closing) setCloseModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Clôturer l’incident
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {closeTarget.reference} — La clôture est définitive.
                </p>
              </div>
              <button
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                disabled={closing}
                onClick={() => setCloseModalOpen(false)}
                title="Fermer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Commentaire de clôture <span className="text-red-500">*</span>
              </label>
              <textarea
                value={closeComment}
                onChange={(e) => setCloseComment(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ex: Incident résolu après redémarrage du service et vérification des logs."
                disabled={closing}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Minimum 3 caractères.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200"
                onClick={() => setCloseModalOpen(false)}
                disabled={closing}
              >
                Annuler
              </button>

              <button
                className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                onClick={submitClose}
                disabled={closing || closeComment.trim().length < 3}
              >
                {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmer la clôture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
