import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CategoryProcessStats, PriorityStats, ServiceVolume } from '../types';
import ExcelJS from 'exceljs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import {
  Layers3,
  Building2,
  ShieldAlert,
  CheckCircle2,
  Ban,
  Inbox,
  TrendingUp,
  RefreshCw,
  Table2,
  FileText,
  FileSpreadsheet,
  Loader2,
  Plus,
} from 'lucide-react';

type PeriodKey = 'ALL' | '7D' | '30D' | 'QUARTER' | 'YEAR';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: '7D', label: '7 jours' },
  { key: '30D', label: '30 jours' },
  { key: 'QUARTER', label: 'Ce trimestre' },
  { key: 'YEAR', label: 'Cette année' },
];

// Priorités affichées dans un ordre métier fixe, avec leur couleur
const PRIORITY_ORDER = ['Critique', 'Haute', 'Moyenne', 'Basse'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  Critique: '#ef4444',
  Haute: '#f59e0b',
  Moyenne: '#3b82f6',
  Basse: '#94a3b8',
};

const STATUS_COLORS = {
  'En cours': '#f59e0b',
  Résolus: '#10b981',
  Annulés: '#94a3b8',
};

const computeDateFrom = (period: PeriodKey): string | undefined => {
  if (period === 'ALL') return undefined;
  const now = new Date();
  let from: Date;
  switch (period) {
    case '7D':
      from = new Date(now.getTime() - 7 * 86400000);
      break;
    case '30D':
      from = new Date(now.getTime() - 30 * 86400000);
      break;
    case 'QUARTER': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    }
    case 'YEAR':
      from = new Date(now.getFullYear(), 0, 1);
      break;
  }
  return from.toISOString();
};

const formatDate = (date: Date): string =>
  date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const Statistiques: React.FC = () => {
  const [catProc, setCatProc] = useState<CategoryProcessStats | null>(null);
  const [services, setServices] = useState<ServiceVolume[]>([]);
  const [priority, setPriority] = useState<PriorityStats>({
    byPriority: [],
    backlogCritical: 0,
  });
  const [period, setPeriod] = useState<PeriodKey>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateFrom = computeDateFrom(period);
      const [catProcData, serviceData, priorityData] = await Promise.all([
        api.getCategoryProcessStats(dateFrom),
        api.getByService(),
        api.getByPriority(),
      ]);
      setCatProc(catProcData);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setPriority(
        priorityData && Array.isArray(priorityData.byPriority)
          ? priorityData
          : { byPriority: [], backlogCritical: 0 }
      );
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Erreur chargement statistiques:', err);
      setError(err?.message || 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Agrégation cohérente avec la période sélectionnée (chaque incident est compté,
  // y compris "Non catégorisé"), pour que KPIs, donut et tableau principal concordent.
  const derived = useMemo(() => {
    const categories = (catProc?.categories ?? []).map((cat) => ({
      ...cat,
      resolutionRate: cat.total > 0 ? Math.round((cat.closed / cat.total) * 100) : 0,
    }));

    const totals = categories.reduce(
      (acc, c) => ({
        total: acc.total + c.total,
        open: acc.open + c.open,
        inProgress: acc.inProgress + c.inProgress,
        closed: acc.closed + c.closed,
        cancelled: acc.cancelled + c.cancelled,
      }),
      { total: 0, open: 0, inProgress: 0, closed: 0, cancelled: 0 }
    );

    const resolutionRate = totals.total > 0 ? Math.round((totals.closed / totals.total) * 100) : 0;

    // « En cours » regroupe les statuts Ouverts + En cours (fusionnés)
    const statusDonut = [
      { name: 'En cours', value: totals.open + totals.inProgress, color: STATUS_COLORS['En cours'] },
      { name: 'Résolus', value: totals.closed, color: STATUS_COLORS.Résolus },
      { name: 'Annulés', value: totals.cancelled, color: STATUS_COLORS.Annulés },
    ].filter((d) => d.value > 0);

    const serviceRows = services
      .slice()
      .sort((a, b) => b.value - a.value)
      .map((s) => ({
        ...s,
        share: totals.total > 0 ? Math.round((s.value / totals.total) * 100) : 0,
      }));

    const priorityRows = PRIORITY_ORDER.map((name) => ({
      name,
      value: priority.byPriority.find((p) => p.name === name)?.value ?? 0,
    })).filter((p) => p.value > 0);

    return {
      categories,
      totals,
      resolutionRate,
      statusDonut,
      serviceRows,
      priorityRows,
      backlogCritical: priority.backlogCritical ?? 0,
      subCategories: catProc?.subCategories ?? [],
      subProcesses: catProc?.subProcesses ?? [],
    };
  }, [catProc, services, priority]);

  if (loading && !catProc) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800 dark:border-slate-400"></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total incidents', value: derived.totals.total, icon: Inbox, chip: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
    { label: 'En cours', value: derived.totals.open + derived.totals.inProgress, icon: TrendingUp, chip: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
    { label: 'Résolus', value: derived.totals.closed, icon: CheckCircle2, chip: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
    { label: 'Annulés', value: derived.totals.cancelled, icon: Ban, chip: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    { label: 'Taux de résolution', value: `${derived.resolutionRate}%`, icon: ShieldAlert, chip: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
  ];

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? 'Tout';
  const exportAt = (lastUpdated ?? new Date()).toLocaleString('fr-FR');
  const dateTag = (lastUpdated ?? new Date()).toISOString().slice(0, 10);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const workbook = new ExcelJS.Workbook();

      // ── Styles réutilisables (thème bleu foncé, comme le rapport premium) ──
      const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      const ZEBRA_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      const TOTAL_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      const SECTION_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      const BORDER: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };

      const applyHeader = (row: ExcelJS.Row) => {
        row.height = 20;
        row.eachCell((cell) => {
          cell.fill = HEADER_FILL;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = BORDER;
        });
      };

      // Ajoute un tableau stylisé : titre fusionné + en-tête + données + totaux
      const addSection = (
        ws: ExcelJS.Worksheet,
        sectionTitle: string,
        headers: string[],
        rows: (string | number)[][],
        options?: {
          widths?: number[];
          numberCols?: number[];
          rateCols?: number[];
          totals?: (string | number)[];
          totalsRateCols?: number[];
          mergeTo?: number;
        }
      ) => {
        const titleRow = ws.addRow([sectionTitle]);
        ws.mergeCells(titleRow.number, 1, titleRow.number, options?.mergeTo ?? headers.length);
        titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };
        titleRow.getCell(1).alignment = { vertical: 'middle' };
        titleRow.getCell(1).fill = SECTION_FILL;
        titleRow.height = 22;

        applyHeader(ws.addRow(headers));

        options?.widths?.forEach((w, i) => {
          ws.getColumn(i + 1).width = w;
        });

        const styleCell = (cell: ExcelJS.Cell, colIdx: number, zebra: boolean) => {
          cell.border = BORDER;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          if (zebra) cell.fill = ZEBRA_FILL;
          if (options?.numberCols?.includes(colIdx)) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0';
          }
          if (options?.rateCols?.includes(colIdx)) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '0"%"';
          }
        };

        rows.forEach((r, idx) => {
          const row = ws.addRow(r);
          row.height = 18;
          row.eachCell((cell, colIdx) => styleCell(cell, colIdx, idx % 2 === 1));
        });

        if (options?.totals) {
          const totalsRow = ws.addRow(options.totals);
          totalsRow.height = 18;
          totalsRow.eachCell((cell, colIdx) => {
            styleCell(cell, colIdx, false);
            cell.font = { bold: true };
            cell.fill = TOTAL_FILL;
            if (options.totalsRateCols?.includes(colIdx)) {
              cell.numFmt = '0"%"';
            } else if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
            }
          });
        }

        ws.addRow([]);
      };

      const addSectionHeader = (ws: ExcelJS.Worksheet, title: string, colCount: number) => {
        const row = ws.addRow([title]);
        ws.mergeCells(row.number, 1, row.number, colCount);
        row.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E3A8A' } };
        row.getCell(1).alignment = { vertical: 'middle' };
        row.getCell(1).fill = SECTION_FILL;
        row.height = 22;
      };

      // ── Feuille « Résumé » (vue d'ensemble complète et structurée) ──
      const wsSummary = workbook.addWorksheet('Résumé');
      wsSummary.properties.tabColor = { argb: 'FF1E3A8A' };
      wsSummary.columns = [{ width: 34 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 18 }];

      const titleRow = wsSummary.addRow(['Tableau statistique des incidents']);
      wsSummary.mergeCells(1, 1, 1, 6);
      titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF1E3A8A' } };
      titleRow.height = 26;

      const metaRow = wsSummary.addRow([`Période : ${periodLabel} · Généré le ${exportAt}`]);
      wsSummary.mergeCells(2, 1, 2, 6);
      metaRow.getCell(1).font = { size: 10, color: { argb: 'FF64748B' } };

      wsSummary.addRow([]);

      // Bloc 1 : indicateurs clés
      addSectionHeader(wsSummary, 'Indicateurs clés', 6);
      applyHeader(wsSummary.addRow(['Indicateur', 'Valeur']));
      const kpiRows: { label: string; value: number; rate?: boolean }[] = [
        { label: 'Total incidents', value: derived.totals.total },
        { label: 'En cours', value: derived.totals.open + derived.totals.inProgress },
        { label: 'Résolus', value: derived.totals.closed },
        { label: 'Annulés', value: derived.totals.cancelled },
        { label: 'Taux de résolution', value: derived.resolutionRate, rate: true },
        { label: 'Backlog critique', value: derived.backlogCritical },
      ];
      kpiRows.forEach((k, idx) => {
        const row = wsSummary.addRow([k.label, k.value]);
        row.height = 18;
        const labelCell = row.getCell(1);
        const valCell = row.getCell(2);
        labelCell.border = BORDER;
        labelCell.alignment = { vertical: 'middle' };
        valCell.border = BORDER;
        valCell.alignment = { vertical: 'middle', horizontal: 'right' };
        valCell.numFmt = k.rate ? '0"%"' : '#,##0';
        if (idx % 2 === 1) {
          labelCell.fill = ZEBRA_FILL;
          valCell.fill = ZEBRA_FILL;
        }
      });

      // Bloc 2 : répartition par catégorie (avec totaux)
      addSection(
        wsSummary,
        'Répartition par catégorie',
        ['Catégorie', 'Total', 'En cours', 'Résolus', 'Annulés', 'Taux de résolution'],
        derived.categories.map((c) => [c.name, c.total, c.inProgress + c.open, c.closed, c.cancelled, c.resolutionRate]),
        {
          numberCols: [2, 3, 4, 5],
          rateCols: [6],
          totals: ['Total', derived.totals.total, derived.totals.open + derived.totals.inProgress, derived.totals.closed, derived.totals.cancelled, derived.resolutionRate],
          totalsRateCols: [6],
          mergeTo: 6,
        }
      );

      // Bloc 3 : volume par service
      addSection(
        wsSummary,
        'Volume par service',
        ['Service', 'Incidents', 'Part (%)'],
        derived.serviceRows.map((s) => [s.name, s.value, s.share]),
        { numberCols: [2], rateCols: [3], mergeTo: 6 }
      );

      // Bloc 4 : répartition par priorité
      addSection(
        wsSummary,
        'Répartition par priorité',
        ['Priorité', 'Incidents'],
        derived.priorityRows.map((p) => [p.name, p.value]),
        { numberCols: [2], mergeTo: 6 }
      );

      // Bloc 5 : top sous-catégories
      addSection(
        wsSummary,
        'Top sous-catégories',
        ['Sous-catégorie', 'Catégorie', 'Total'],
        derived.subCategories.slice(0, 8).map((s) => [s.name, s.categoryName, s.total]),
        { numberCols: [3], mergeTo: 6 }
      );

      // Bloc 6 : top sous-processus
      addSection(
        wsSummary,
        'Top sous-processus',
        ['Sous-processus', 'Processus', 'Total'],
        derived.subProcesses.slice(0, 8).map((s) => [s.name, s.processName, s.total]),
        { numberCols: [3], mergeTo: 6 }
      );

      // ── Feuille « Par Catégorie » ──
      const wsCat = workbook.addWorksheet('Par Catégorie');
      wsCat.properties.tabColor = { argb: 'FF1E3A8A' };
      addSection(
        wsCat,
        'Répartition des incidents par catégorie',
        ['Catégorie', 'Total', 'En cours', 'Résolus', 'Annulés', 'Taux de résolution'],
        derived.categories.map((c) => [c.name, c.total, c.inProgress + c.open, c.closed, c.cancelled, c.resolutionRate]),
        {
          widths: [30, 12, 12, 12, 12, 18],
          numberCols: [2, 3, 4, 5],
          rateCols: [6],
          totals: ['Total', derived.totals.total, derived.totals.open + derived.totals.inProgress, derived.totals.closed, derived.totals.cancelled, derived.resolutionRate],
          totalsRateCols: [6],
        }
      );

      // ── Feuille « Par Service » ──
      const wsService = workbook.addWorksheet('Par Service');
      wsService.properties.tabColor = { argb: 'FF1E3A8A' };
      addSection(
        wsService,
        'Volume par service',
        ['Service', 'Incidents', 'Part (%)'],
        derived.serviceRows.map((s) => [s.name, s.value, s.share]),
        { widths: [34, 12, 12], numberCols: [2], rateCols: [3] }
      );

      // ── Feuille « Par Priorité » ──
      const wsPrio = workbook.addWorksheet('Par Priorité');
      wsPrio.properties.tabColor = { argb: 'FF1E3A8A' };
      addSection(
        wsPrio,
        'Répartition par priorité',
        ['Priorité', 'Incidents'],
        derived.priorityRows.map((p) => [p.name, p.value]),
        { widths: [18, 12], numberCols: [2] }
      );

      // ── Feuille « Sous-catégories » ──
      const wsSubCat = workbook.addWorksheet('Sous-catégories');
      wsSubCat.properties.tabColor = { argb: 'FF1E3A8A' };
      addSection(
        wsSubCat,
        'Top sous-catégories',
        ['Sous-catégorie', 'Catégorie', 'Total'],
        derived.subCategories.map((s) => [s.name, s.categoryName, s.total]),
        { widths: [30, 26, 12], numberCols: [3] }
      );

      // ── Feuille « Sous-processus » ──
      const wsSubProc = workbook.addWorksheet('Sous-processus');
      wsSubProc.properties.tabColor = { argb: 'FF1E3A8A' };
      addSection(
        wsSubProc,
        'Top sous-processus',
        ['Sous-processus', 'Processus', 'Total'],
        derived.subProcesses.map((s) => [s.name, s.processName, s.total]),
        { widths: [30, 26, 12], numberCols: [3] }
      );

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(blob, `tableau_statistique_${dateTag}.xlsx`);
    } catch (err: any) {
      console.error('Erreur export Excel:', err);
      alert(err?.message || 'Impossible de générer le fichier Excel.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      // Génération côté backend (Playwright + en-tête SOREPCO), comme les autres PDF de l'app
      const blob = await api.exportStatisticsPdf({
        dateFrom: computeDateFrom(period),
        periodLabel,
      });
      downloadBlob(blob, `tableau_statistique_${dateTag}.pdf`);
    } catch (err: any) {
      console.error('Erreur export PDF:', err);
      alert(err?.message || 'Impossible de générer le PDF.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 xl:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Tableau statistique des incidents
          </h1>
          <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400 mt-1">
            Analyse quantitative détaillée : répartition par catégorie, statut, service, priorité et processus.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            onClick={() => navigate('/incidents/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Déclarer un nouvel incident
          </button>
          <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150 ${
                period === p.key
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            disabled={loading}
            title="Actualiser les données"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={loading || !!exporting}
            title="Exporter le tableau statistique en PDF"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {exporting === 'pdf' ? 'Génération…' : 'Générer PDF'}
            </span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || !!exporting}
            title="Exporter le tableau statistique en Excel (.xlsx)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting === 'excel' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {exporting === 'excel' ? 'Génération…' : 'Générer Excel'}
            </span>
          </button>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Dernière mise à jour : {formatDate(lastUpdated)}
          {period !== 'ALL' ? ' · Données filtrées sur la période sélectionnée' : ''}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Bandeau KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {kpi.label}
              </p>
              <div className={`p-2 rounded-lg ${kpi.chip}`}>
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tableau principal + donut */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card
          title="Répartition des incidents par catégorie"
          description="Nombre d'incidents par catégorie et par statut sur la période sélectionnée."
          className="xl:col-span-8"
        >
          <div className="overflow-x-auto">
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 pr-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                      Catégorie
                    </th>
                    <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                      Total
                    </th>
                    <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-medium">
                      En cours
                    </th>
                    <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">
                      Résolus
                    </th>
                    <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                      Annulés
                    </th>
                    <th className="text-right py-3 pl-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                      Taux de résolution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {derived.categories.length ? (
                    derived.categories.map((cat) => (
                      <tr
                        key={cat.name}
                        className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="py-3 pr-3 text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            {cat.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                          {cat.total}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">
                          {cat.inProgress + cat.open}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {cat.closed}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 dark:text-slate-500 tabular-nums">
                          {cat.cancelled}
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${cat.resolutionRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                              {cat.resolutionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                        Aucune donnée disponible pour la période sélectionnée.
                      </td>
                    </tr>
                  )}
                </tbody>
                {derived.categories.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60">
                      <td className="py-3 pr-3 text-sm font-semibold text-slate-900 dark:text-white">
                        Total
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                        {derived.totals.total}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        {derived.totals.open + derived.totals.inProgress}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {derived.totals.closed}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                        {derived.totals.cancelled}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${derived.resolutionRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {derived.resolutionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </Card>

        <Card
          title="Répartition par statut"
          description="Synthèse visuelle des statuts sur la période sélectionnée."
          className="xl:col-span-4"
        >
          <div className="h-[240px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={derived.statusDonut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="none"
                >
                  {derived.statusDonut.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {derived.totals.total}
                </span>
                <span className="block text-[11px] text-slate-400 uppercase tracking-[0.24em] font-medium">
                  Incidents
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {derived.statusDonut.length ? (
              derived.statusDonut.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {d.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Aucune donnée.</p>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-red-200/60 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <ShieldAlert className="h-4 w-4" />
              Backlog critique
            </div>
            <span className="text-lg font-semibold text-red-700 dark:text-red-300 tabular-nums">
              {derived.backlogCritical}
            </span>
          </div>
        </Card>
      </div>

      {/* Volume par service + Priorité */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card
          title="Volume par service"
          description="Nombre total d'incidents par service (répartition globale)."
          className="xl:col-span-6"
        >
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 pr-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Service
                  </th>
                  <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Incidents
                  </th>
                  <th className="text-right py-3 pl-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Part
                  </th>
                </tr>
              </thead>
              <tbody>
                {derived.serviceRows.length ? (
                  derived.serviceRows.map((s) => (
                    <tr
                      key={s.name}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3 pr-3 text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          {s.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                        {s.value}
                      </td>
                      <td className="py-3 pl-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${s.share}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums w-10 text-right">
                            {s.share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                      Aucune donnée service disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Répartition par priorité"
          description="Incidents répartis par niveau de criticité (répartition globale)."
          className="xl:col-span-6"
        >
          <div className="space-y-4">
            {derived.priorityRows.length ? (
              derived.priorityRows.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS[p.name] }}
                      />
                      {p.name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {p.value}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${derived.totals.total > 0 ? (p.value / derived.totals.total) * 100 : 0}%`,
                        backgroundColor: PRIORITY_COLORS[p.name],
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Aucune donnée priorité disponible.</p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">Taux de résolution global</span>
            <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {derived.resolutionRate}%
            </span>
          </div>
        </Card>
      </div>

      {/* Sous-catégories + Sous-processus */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card
          title="Top sous-catégories"
          description="Les sous-catégories les plus sollicitées sur la période sélectionnée."
          className="xl:col-span-6"
        >
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 pr-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Sous-catégorie
                  </th>
                  <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Catégorie
                  </th>
                  <th className="text-right py-3 pl-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {derived.subCategories.length ? (
                  derived.subCategories.slice(0, 8).map((item) => (
                    <tr
                      key={`${item.name}-${item.categoryName}`}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3 pr-3 text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-2">
                          <Layers3 className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          {item.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{item.categoryName}</td>
                      <td className="py-3 pl-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                        {item.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                      Aucune sous-catégorie renseignée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Top sous-processus"
          description="Les sous-processus les plus sollicités sur la période sélectionnée."
          className="xl:col-span-6"
        >
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 pr-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Sous-processus
                  </th>
                  <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Processus
                  </th>
                  <th className="text-right py-3 pl-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {derived.subProcesses.length ? (
                  derived.subProcesses.slice(0, 8).map((item) => (
                    <tr
                      key={`${item.name}-${item.processName}`}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3 pr-3 text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-2">
                          <Table2 className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                          {item.name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{item.processName}</td>
                      <td className="py-3 pl-3 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                        {item.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-slate-400">
                      Aucun sous-processus renseigné.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
