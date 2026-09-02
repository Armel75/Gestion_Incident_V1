import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  RefreshCw,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Filter as FilterIcon,
  XCircle,
} from "lucide-react";
import { GlpiTicketFilterPanel } from "../src/components/filters/GlpiTicketFilterPanel";
import { serializeGlpiTicketRows } from "../src/utils/serializeGlpiTickets";
import type { GlpiFilterRowState } from "../src/constants/glpiTicketFilterColumns";
import type { Logic } from "../src/components/filters/types";

type GlpiTicket = {
  id: number;
  glpiId: number;
  ticketNumber: string | null;
  title: string;
  description: string | null;
  status: string | null;
  statusLabel: string | null;
  priority: string | null;
  priorityLabel: string | null;
  urgency: string | null;
  urgencyLabel: string | null;
  impact: string | null;
  impactLabel: string | null;
  categoryName: string | null;
  entityName: string | null;
  locationName: string | null;
  requesterName: string | null;
  assigneeName: string | null;
  openedAt: string | null;
  dueAt: string | null;
  lastSyncedAt: string | null;
};

/* Options de filtre par statut GLPI (1..6) */
const STATUS_OPTIONS: { value: string[]; label: string }[] = [
  { value: ["1", "2", "3", "4"], label: "Ouverts (non clôturés)" },
  { value: ["1"], label: "Nouveau" },
  { value: ["2"], label: "En cours" },
  { value: ["3"], label: "En attente" },
  { value: ["4"], label: "Résolu" },
  { value: ["5"], label: "Clôturé" },
  { value: ["6"], label: "Annulé" },
  { value: ["1", "2", "3", "4", "5", "6"], label: "Tous les statuts" },
];

const STATUS_STYLES: Record<string, string> = {
  "1": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "2": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "3": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "4": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "5": "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "6": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const PAGE_SIZE = 10;

/* La description GLPI est du HTML encodé (ex: &#60;p&#62;) : on décode les
   entités puis on retire les balises pour un affichage texte propre. */
const decodeEntities = (s: string): string =>
  s
    .replace(/&#60;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

const stripHtml = (html: string | null | undefined): string =>
  decodeEntities(String(html ?? ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const TicketGLPI: React.FC = () => {
  const [tickets, setTickets] = useState<GlpiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>(["1", "2", "3", "4"]);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  // ✅ Filter Builder (filtres avancés multi-colonnes)
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftLogic, setDraftLogic] = useState<Logic>("AND");
  const [draftRows, setDraftRows] = useState<GlpiFilterRowState[]>([]);
  const [appliedQuery, setAppliedQuery] = useState<{
    logic: Logic;
    rows: GlpiFilterRowState[];
  }>({ logic: "AND", rows: [] });

  const requestSeq = React.useRef(0);
  const filtersActive = appliedQuery.rows.length > 0;

  const fetchTickets = async (
    targetPage: number,
    statuses: string[],
    advQuery: { logic: Logic; rows: GlpiFilterRowState[] }
  ) => {
    const seq = ++requestSeq.current;
    setLoading(true);

    try {
      const advPayload = serializeGlpiTicketRows({
        logic: advQuery.logic,
        rows: advQuery.rows,
        page: targetPage,
        pageSize: PAGE_SIZE,
        tz: "Africa/Douala",
      });

      const payload = {
        // le filtre statut (liste déroulante) est TOUJOURS appliqué,
        // les filtres avancés viennent s'y combiner en ET
        logic: "AND" as const,
        filters: [
          { field: "status", op: "in" as const, value: statuses },
          ...advPayload.filters,
        ],
        sort: [{ field: "glpiId", dir: "desc" as const }],
        page: targetPage,
        pageSize: PAGE_SIZE,
        tz: "Africa/Douala",
      };

      const result = await api.queryGlpiTickets(payload);

      if (seq !== requestSeq.current) return;

      setTickets(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
      setSyncedAt(new Date());
    } catch (err) {
      console.error(err);
      if (seq === requestSeq.current) {
        setTickets([]);
        setTotal(0);
        setTotalPages(1);
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  // Charge au montage et quand page/filtres changent
  useEffect(() => {
    fetchTickets(page, statusFilter, appliedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, appliedQuery]);

  const handleStatusChange = (value: string) => {
    const option = STATUS_OPTIONS.find((o) => o.label === value);
    if (!option) return;
    setStatusFilter(option.value);
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedQuery({ logic: draftLogic, rows: draftRows });
    setPage(1);
    setFilterOpen(false);
  };

  const clearAdvancedFilters = () => {
    setDraftLogic("AND");
    setDraftRows([]);
    setAppliedQuery({ logic: "AND", rows: [] });
    setPage(1);
  };

  const handleRefresh = () => {
    fetchTickets(page, statusFilter, appliedQuery);
  };

  const currentLabel =
    STATUS_OPTIONS.find(
      (o) =>
        o.value.length === statusFilter.length &&
        o.value.every((v, i) => v === statusFilter[i])
    )?.label ?? "Ouverts (non clôturés)";

  const fmtDate = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("fr-FR") : "—";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Action Bar */}
      <div className="flex flex-col px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-900 dark:bg-brand-600 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                Tickets GLPI
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {total} ticket(s) — {currentLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(true)}
              className={`h-8 px-3 rounded-md text-sm font-medium flex items-center gap-2 transition-colors border ${
                filtersActive
                  ? "bg-brand-600 hover:bg-brand-500 text-white border-brand-600 dark:bg-brand-600 dark:border-brand-600"
                  : "bg-slate-900 dark:bg-brand-600 text-white border-slate-900 dark:border-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500"
              }`}
              title="Filtrer sur toutes les colonnes (serveur)"
            >
              <FilterIcon className="h-4 w-4" />
              Filtrer
            </button>

            <button
              onClick={handleRefresh}
              className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              title="Recharger les tickets (la sync GLPI tourne chaque minute)"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtre par statut + filtres avancés actifs */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Statut
          </label>
          <select
            value={currentLabel}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>

          {filtersActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/50 px-2 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-700/10">
              {appliedQuery.rows.length} filtre(s) avancé(s) actif(s)
              <button
                onClick={clearAdvancedFilters}
                className="text-brand-600 hover:text-brand-900 dark:hover:text-white"
                title="Effacer les filtres avancés"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {syncedAt && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Dernière sync : {syncedAt.toLocaleTimeString("fr-FR")}
            </span>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Chargement des tickets GLPI...
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <Inbox className="h-10 w-10 mb-2 text-slate-300 dark:text-slate-600" />
            <p>Aucun ticket GLPI trouvé pour ce statut.</p>
            <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">
              Vérifie que la synchronisation GLPI (cron) a bien démarré.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/90 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-28">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-28 hidden md:table-cell">
                  Urgence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Demandeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Technicien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                  Ouvert le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">
                  Échéance
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {ticket.glpiId}
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {ticket.title || `Ticket ${ticket.glpiId}`}
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell align-top">
                    {stripHtml(ticket.description) ? (
                      <div className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 max-w-md">
                        {stripHtml(ticket.description)}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_STYLES[ticket.status ?? ""] ??
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {ticket.statusLabel ?? ticket.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {ticket.priorityLabel ? (
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {ticket.priorityLabel}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    {ticket.urgencyLabel ? (
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {ticket.urgencyLabel}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    {ticket.categoryName ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                        {ticket.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden lg:table-cell">
                    {ticket.requesterName ? (
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {ticket.requesterName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap hidden lg:table-cell">
                    {ticket.assigneeName ? (
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {ticket.assigneeName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    {fmtDate(ticket.openedAt)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                    {fmtDate(ticket.dueAt)}
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
          <span className="font-medium text-slate-900 dark:text-white">{page}</span>{" "}
          sur{" "}
          <span className="font-medium text-slate-900 dark:text-white">{totalPages}</span>
          <span className="ml-2 text-slate-400 dark:text-slate-500">
            ({total} ticket(s))
          </span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ✅ Panneau de filtres avancés (multi-colonnes, serveur) */}
      <GlpiTicketFilterPanel
        open={filterOpen}
        logic={draftLogic}
        rows={draftRows}
        onClose={() => setFilterOpen(false)}
        onChangeLogic={setDraftLogic}
        onChangeRows={setDraftRows}
        onReset={clearAdvancedFilters}
        onApply={applyFilters}
        isQueryLoading={loading}
      />
    </div>
  );
};

export default TicketGLPI;
