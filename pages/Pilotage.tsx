import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { CategoryProcessStats, IncidentStats } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Layers3, FolderTree, Workflow, FileText, FileSpreadsheet, Loader2, Plus } from 'lucide-react';
import ExcelJS from 'exceljs';
import { EXCEL_STYLE, addExcelSection, downloadWorkbook } from '../src/utils/excelReport';

type PeriodKey = 'ALL' | '30D' | 'QUARTER' | 'YEAR';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: '30D', label: '30 jours' },
  { key: 'QUARTER', label: 'Ce trimestre' },
  { key: 'YEAR', label: 'Cette année' },
];

const PALETTE_CAT = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'];
const PALETTE_PROC = ['#6366f1', '#ec4899', '#22d3ee', '#f43f5e', '#a855f7', '#eab308', '#34d399', '#fb923c'];

const computeDateFrom = (period: PeriodKey): string | undefined => {
  if (period === 'ALL') return undefined;
  const now = new Date();
  let from: Date;
  switch (period) {
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

export const Pilotage: React.FC = () => {
  const [data, setData] = useState<CategoryProcessStats | null>(null);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('ALL');
  const [exporting, setExporting] = useState<null | 'pdf' | 'excel'>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dateFrom = computeDateFrom(period);
        const [catProcData, simpleStats] = await Promise.all([
          api.getCategoryProcessStats(dateFrom),
          api.getSimpleStats(),
        ]);
        setData(catProcData);
        setStats(simpleStats);
      } catch (error) {
        console.error('Erreur chargement pilotage:', error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [period]);
  const derived = useMemo(() => {
    if (!data || !stats) return null;
    const total = (stats.open || 0) + (stats.inProgress || 0) + (stats.closed || 0) + (stats.cancelled || 0);
    const resolutionRate = total > 0 ? Math.round(((stats.closed || 0) / total) * 100) : 0;
    const topCategories = data.categories.slice(0, 10);
    const topProcesses = data.processes.slice(0, 10);
    const topSubCategories = data.subCategories.slice(0, 5);
    const topSubProcesses = data.subProcesses.slice(0, 5);
    return { total, resolutionRate, topCategories, topProcesses, topSubCategories, topSubProcesses, nbCategories: data.categories.length, nbProcesses: data.processes.length };
  }, [data, stats]);
  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-800 dark:border-slate-400"></div></div>;
  }

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

  const handleExportPdf = async () => {
    if (!data) return;
    setExporting('pdf');
    try {
      const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? 'Tout';
      const dateTag = new Date().toISOString().slice(0, 10);
      // Génération côté backend (Playwright + en-tête SOREPCO), comme les autres PDF de l'app
      const blob = await api.exportPilotagePdf({
        dateFrom: computeDateFrom(period),
        periodLabel,
      });
      downloadBlob(blob, `pilotage_${dateTag}.pdf`);
    } catch (err: any) {
      console.error('Erreur export PDF:', err);
      alert(err?.message || 'Impossible de générer le PDF.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!data || !derived) return;
    setExporting('excel');
    try {
      const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? 'Tout';
      const dateTag = new Date().toISOString().slice(0, 10);
      const exportAt = new Date().toLocaleString('fr-FR');

      const catTotals = data.categories.reduce(
        (acc, c) => ({
          total: acc.total + (c.total || 0),
          open: acc.open + (c.open || 0),
          inProgress: acc.inProgress + (c.inProgress || 0),
          closed: acc.closed + (c.closed || 0),
          cancelled: acc.cancelled + (c.cancelled || 0),
        }),
        { total: 0, open: 0, inProgress: 0, closed: 0, cancelled: 0 }
      );
      const catResolutionRate = catTotals.total > 0 ? Math.round((catTotals.closed / catTotals.total) * 100) : 0;

      const workbook = new ExcelJS.Workbook();

      // Feuille « Catégories » (en premier)
      const wsCat = workbook.addWorksheet('Catégories');
      wsCat.properties.tabColor = { argb: 'FF1E3A8A' };
      addExcelSection(
        wsCat,
        'Répartition des incidents par catégorie',
        ['Catégorie', 'Total', 'En cours', 'Résolus', 'Annulés', 'Taux de résolution'],
        data.categories.map((c) => [c.name, c.total, c.inProgress + c.open, c.closed, c.cancelled, c.total > 0 ? Math.round((c.closed / c.total) * 100) : 0]),
        {
          widths: [30, 12, 12, 12, 12, 18],
          numberCols: [2, 3, 4, 5],
          rateCols: [6],
          totals: ['Total', catTotals.total, catTotals.open + catTotals.inProgress, catTotals.closed, catTotals.cancelled, catResolutionRate],
          totalsRateCols: [6],
        }
      );

      // Feuille « Processus »
      const wsProc = workbook.addWorksheet('Processus');
      wsProc.properties.tabColor = { argb: 'FF1E3A8A' };
      addExcelSection(
        wsProc,
        'Incidents par processus',
        ['Processus', 'Total'],
        data.processes.map((p) => [p.name, p.total]),
        { widths: [30, 12], numberCols: [2] }
      );

      // Feuille « Sous-catégories »
      const wsSubCat = workbook.addWorksheet('Sous-catégories');
      wsSubCat.properties.tabColor = { argb: 'FF1E3A8A' };
      addExcelSection(
        wsSubCat,
        'Top sous-catégories',
        ['Sous-catégorie', 'Catégorie', 'Total'],
        data.subCategories.slice(0, 8).map((s) => [s.name, s.categoryName, s.total]),
        { widths: [30, 26, 12], numberCols: [3] }
      );

      // Feuille « Sous-processus »
      const wsSubProc = workbook.addWorksheet('Sous-processus');
      wsSubProc.properties.tabColor = { argb: 'FF1E3A8A' };
      addExcelSection(
        wsSubProc,
        'Top sous-processus',
        ['Sous-processus', 'Processus', 'Total'],
        data.subProcesses.slice(0, 8).map((s) => [s.name, s.processName, s.total]),
        { widths: [30, 26, 12], numberCols: [3] }
      );

      // Feuille « Résumé »
      const wsSummary = workbook.addWorksheet('Résumé');
      wsSummary.properties.tabColor = { argb: 'FF1E3A8A' };
      wsSummary.columns = [{ width: 34 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];

      const titleRow = wsSummary.addRow(['Pilotage des catégories et processus']);
      wsSummary.mergeCells(1, 1, 1, 6);
      titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: EXCEL_STYLE.TITLE_COLOR } };
      titleRow.height = 26;

      const metaRow = wsSummary.addRow([`Période : ${periodLabel} · Généré le ${exportAt}`]);
      wsSummary.mergeCells(2, 1, 2, 6);
      metaRow.getCell(1).font = { size: 10, color: { argb: EXCEL_STYLE.MUTED_COLOR } };
      wsSummary.addRow([]);

      addExcelSection(
        wsSummary,
        'Synthèse',
        ['Indicateur', 'Valeur'],
        [
          ['Total incidents', derived.total],
          ['Catégories concernées', derived.nbCategories],
          ['Processus concernés', derived.nbProcesses],
          ['Taux de résolution', `${derived.resolutionRate}%`],
        ],
        { numberCols: [2], mergeTo: 6 }
      );

      await downloadWorkbook(workbook, `pilotage_${dateTag}.xlsx`);
    } catch (err: any) {
      console.error('Erreur export Excel:', err);
      alert(err?.message || 'Impossible de générer le fichier Excel.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 xl:p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Pilotage des catégories et processus</h1>
          <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400 mt-1">Répartition des incidents par catégorie, sous-catégorie, processus et sous-processus.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/incidents/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Déclarer un nouvel incident
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150 ${period === p.key ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'}`}>
            {p.label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700"></span>
        <button
          onClick={handleExportPdf}
          disabled={loading || !!exporting}
          title="Générer le rapport Pilotage en PDF"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting === 'pdf' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span>{exporting === 'pdf' ? 'Génération…' : 'Générer PDF'}</span>
        </button>
        <button
          onClick={handleExportExcel}
          disabled={loading || !!exporting}
          title="Générer le rapport Pilotage en Excel"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting === 'excel' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          <span>{exporting === 'excel' ? 'Génération…' : 'Générer Excel'}</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total incidents', value: derived?.total ?? 0, color: 'blue' },
          { label: 'Catégories concernées', value: derived?.nbCategories ?? 0, color: 'amber' },
          { label: 'Processus concernés', value: derived?.nbProcesses ?? 0, color: 'emerald' },
          { label: 'Taux de résolution', value: `${derived?.resolutionRate ?? 0}%`, color: 'green' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-${kpi.color}-50 dark:bg-${kpi.color}-950/30 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
                <Layers3 size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Incidents par Catégorie (Top 10)">
          <div className="h-80 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived?.topCategories ?? []} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis type="number" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }} contentStyle={tooltipStyle} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20}>
                  {derived?.topCategories.map((_, index) => <Cell key={`cat-${index}`} fill={PALETTE_CAT[index % PALETTE_CAT.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Incidents par Processus (Top 10)">
          <div className="h-80 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived?.topProcesses ?? []} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis type="number" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }} contentStyle={tooltipStyle} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={20}>
                  {derived?.topProcesses.map((_, index) => <Cell key={`proc-${index}`} fill={PALETTE_PROC[index % PALETTE_PROC.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Sous-catégories">
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Sous-catégorie</th>
                  <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Catégorie</th>
                  <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {derived?.topSubCategories.length ? derived.topSubCategories.map((item, index) => (
                  <tr key={item.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-3 text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE_CAT[index % PALETTE_CAT.length] }} />{item.name}</span></td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{item.categoryName}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">{item.total}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="py-6 text-center text-sm text-slate-400">Aucune sous-catégorie renseignée.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Top Sous-processus">
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Sous-processus</th>
                  <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Processus</th>
                  <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {derived?.topSubProcesses.length ? derived.topSubProcesses.map((item, index) => (
                  <tr key={item.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-3 text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE_PROC[index % PALETTE_PROC.length] }} />{item.name}</span></td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{item.processName}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">{item.total}</td>
                  </tr>
                )) : <tr><td colSpan={3} className="py-6 text-center text-sm text-slate-400">Aucun sous-processus renseigné.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card title="Répartition par statut des catégories">
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Catégorie</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Total</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-medium">Ouverts</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">Résolus</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">Annulés</th>
              </tr>
            </thead>
            <tbody>
              {data?.categories.length ? data.categories.slice(0, 15).map((cat, index) => (
                <tr key={cat.name} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-3 text-slate-900 dark:text-white"><span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE_CAT[index % PALETTE_CAT.length] }} />{cat.name}</span></td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">{cat.total}</td>
                  <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400">{cat.open}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{cat.closed}</td>
                  <td className="py-3 px-3 text-right text-slate-400 dark:text-slate-500">{cat.cancelled}</td>
                </tr>
              )) : <tr><td colSpan={5} className="py-6 text-center text-sm text-slate-400">Aucune donnée catégorie disponible.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};