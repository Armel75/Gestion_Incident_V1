import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import {
  WeeklyReportData,
  WeeklyReportPeriod,
  WeeklyReportKpi,
  WeeklyReportComparison,
  WeeklyReportByService,
  WeeklyReportByPriority,
  WeeklyReportTrendDay,
} from '../types';
import { Card } from '../components/ui/Card';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../src/types/auth/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers3,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  Search,
  X,
  Check,
} from 'lucide-react';

/* ─────────────────────────────────────────────── */
/*  Helpers                                         */
/* ─────────────────────────────────────────────── */

const formatHours = (h: number | null): string => {
  if (h === null || h === undefined) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins > 0 ? `${hours}h ${mins}` : `${hours}h`;
};

const formatRate = (rate: number | null, cappedRate: number): string => {
  if (rate === null) return 'N/A';
  return `${cappedRate.toFixed(1)}%`;
};

const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'];
const PALETTE_PRIORITY: Record<string, string> = {
  Critique: '#ef4444',
  Haute: '#f97316',
  Moyenne: '#f59e0b',
  Basse: '#3b82f6',
};

const VariantBadge: React.FC<{ value: number | null; unit?: 'pct' | 'pts'; inverse?: boolean }> = ({
  value, unit = 'pct', inverse = false,
}) => {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  const abs = Math.abs(value);
  const formatted = unit === 'pts' ? `${abs.toFixed(1)} pts` : `${abs.toFixed(1)}%`;
  if (Math.abs(value) < 0.01) return <span className="text-slate-400">→ {formatted}</span>;
  const isGood = inverse ? value < 0 : value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {isGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {formatted}
    </span>
  );
};

/* ─────────────────────────────────────────────── */
/*  Sous-composant : KpiCard                        */
/* ─────────────────────────────────────────────── */

const KpiCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'amber' | 'slate';
  comparison?: React.ReactNode;
  note?: string;
}> = ({ title, value, subtitle, icon: Icon, color, comparison, note }) => {
  const colorMap = {
    emerald: 'border-emerald-200/60 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20',
    blue: 'border-blue-200/60 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20',
    amber: 'border-amber-200/60 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20',
    slate: 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-950',
  };
  const iconColorMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
    slate: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-medium">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
          {comparison && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 dark:text-slate-500">S-1</span>
              {comparison}
            </div>
          )}
          {note && (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">{note}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ml-4 ${iconColorMap[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Sous-composant : WeekSelector Premium          */
/* ─────────────────────────────────────────────── */

const WeekSelector: React.FC<{
  weeks: WeeklyReportPeriod[];
  current: string;
  onChange: (key: string) => void;
}> = ({ weeks, current, onChange }) => {
  const currentIdx = weeks.findIndex(
    (w) => `${w.year}-W${String(w.weekNumber).padStart(2, '0')}` === current,
  );
  const hasPrev = currentIdx < weeks.length - 1;
  const hasNext = currentIdx > 0;

  // La semaine la plus récente = semaine courante (tri décroissant)
  const currentWeekKey = weeks.length > 0
    ? `${weeks[0].year}-W${String(weeks[0].weekNumber).padStart(2, '0')}`
    : '';

  // ── Dropdown searchable ──
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const currentWeek =
    weeks.find(
      (w) => `${w.year}-W${String(w.weekNumber).padStart(2, '0')}` === current,
    ) ?? null;

  const filteredWeeks = useMemo(() => {
    if (!query.trim()) return weeks;
    const q = query.toLowerCase();
    return weeks.filter((w) => {
      const label = `${w.label} ${w.startDate} ${w.endDate}`.toLowerCase();
      // Permet de chercher par numéro de semaine, année, ou date
      return (
        label.includes(q) ||
        String(w.weekNumber).includes(q) ||
        String(w.year).includes(q) ||
        w.startDate.includes(q)
      );
    });
  }, [weeks, query]);

  // Reset focused index when filtered list changes
  useEffect(() => {
    setFocusedIdx(-1);
  }, [filteredWeeks.length]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIdx >= 0 && listRef.current) {
      const el = listRef.current.children[focusedIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIdx]);

  const selectWeek = (key: string) => {
    onChange(key);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIdx((prev) =>
          prev < filteredWeeks.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIdx((prev) =>
          prev > 0 ? prev - 1 : filteredWeeks.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIdx >= 0 && focusedIdx < filteredWeeks.length) {
          const w = filteredWeeks[focusedIdx];
          selectWeek(`${w.year}-W${String(w.weekNumber).padStart(2, '0')}`);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setQuery('');
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* ◀ Bouton précédent */}
      <button
        onClick={() => {
          if (hasPrev) {
            onChange(
              `${weeks[currentIdx + 1].year}-W${String(weeks[currentIdx + 1].weekNumber).padStart(2, '0')}`,
            );
          }
        }}
        disabled={!hasPrev}
        title="Semaine précédente"
        className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 shadow-sm text-xs font-medium"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {/* 🔍 Sélecteur searchable */}
      <div ref={containerRef} className="relative min-w-[240px]">
        {/* Affichage */}
        <button
          onClick={() => {
            setOpen(!open);
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150 shadow-sm text-left"
        >
          <Calendar size={16} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5 self-start" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {currentWeek?.label ?? 'Sélectionner une semaine'}
            </div>
            {currentWeek && (
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                {currentWeek.startDate} → {currentWeek.endDate}
              </div>
            )}
          </div>
          <ChevronRight
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Search input */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Search
                size={15}
                className="text-slate-400 dark:text-slate-500 flex-shrink-0"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher une semaine (n°, année, date...)"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none outline-none focus:ring-0"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Liste */}
            {filteredWeeks.length > 0 ? (
              <ul
                ref={listRef}
                className="max-h-56 overflow-y-auto py-1 scroll-smooth"
              >
                {filteredWeeks.map((w, idx) => {
                  const key = `${w.year}-W${String(w.weekNumber).padStart(2, '0')}`;
                  const isSelected = key === current;
                  const isFocused = idx === focusedIdx;
                  return (
                    <li
                      key={key}
                      onClick={() => selectWeek(key)}
                      onMouseEnter={() => setFocusedIdx(idx)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer text-sm transition-colors duration-75 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30'
                          : isFocused
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500'
                            : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              isSelected
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {w.label}
                          </span>
                          {key === currentWeekKey && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                              En cours
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                          {w.startDate} → {w.endDate}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                Aucune semaine trouvée pour "{query}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* ▶ Bouton suivant */}
      <button
        onClick={() => {
          if (hasNext) {
            onChange(
              `${weeks[currentIdx - 1].year}-W${String(weeks[currentIdx - 1].weekNumber).padStart(2, '0')}`,
            );
          }
        }}
        disabled={!hasNext}
        title="Semaine suivante"
        className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 shadow-sm text-xs font-medium"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight size={16} />
      </button>

      {/* 🔄 Cette semaine */}
      <button
        onClick={() => onChange(currentWeekKey)}
        disabled={current === currentWeekKey || !currentWeekKey}
        title="Revenir à la semaine en cours"
        className={[
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 shadow-sm border',
          current === currentWeekKey || !currentWeekKey
            ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-default'
            : 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 cursor-pointer',
        ].join(' ')}
      >
        <Calendar size={14} />
        Cette semaine
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Sous-composant : ComparisonTable                */
/* ─────────────────────────────────────────────── */

const ComparisonTable: React.FC<{
  kpi: WeeklyReportKpi;
  comparison: WeeklyReportComparison;
}> = ({ kpi, comparison }) => {
  const rows = [
    {
      label: 'Incidents créés',
      current: String(kpi.created),
      previous: String(comparison.previousWeek.created),
      change: <VariantBadge value={comparison.createdChange} />,
    },
    {
      label: 'Incidents résolus',
      current: String(kpi.resolved),
      previous: String(comparison.previousWeek.resolved),
      change: <VariantBadge value={comparison.resolvedChange} />,
    },
    {
      label: 'Taux de résolution',
      current: formatRate(kpi.resolutionRate, kpi.cappedRate),
      previous: formatRate(comparison.previousWeek.resolutionRate, comparison.previousWeek.cappedRate),
      change: <VariantBadge value={comparison.resolutionRateChange} unit="pts" />,
    },
    {
      label: 'Incidents en cours (fin de semaine)',
      current: String(kpi.backlogEnd),
      previous: String(comparison.previousWeek.backlogEnd),
      change: <VariantBadge value={comparison.backlogEndChange} inverse />,
    },
    {
      label: 'Temps moyen de résolution',
      current: formatHours(kpi.avgResolutionHours),
      previous: formatHours(comparison.previousWeek.avgResolutionHours),
      change: <VariantBadge value={comparison.avgResolutionChange} inverse />,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <th className="text-left py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Métrique</th>
            <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">S (courante)</th>
            <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">S-1</th>
            <th className="text-right py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Variation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {rows.map((row) => (
            <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
              <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">{row.label}</td>
              <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">{row.current}</td>
              <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400">{row.previous}</td>
              <td className="py-3.5 px-4 text-right">{row.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Sous-composant : TrendChart (journalier)        */
/* ─────────────────────────────────────────────── */

const TrendChart: React.FC<{ data: WeeklyReportTrendDay[] }> = ({ data }) => {
  const { theme } = useTheme();
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
          <XAxis
            dataKey="dayLabel"
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
          />
          <Bar dataKey="created" name="Créés" radius={[4, 4, 0, 0]} fill="#3b82f6" maxBarSize={32} />
          <Bar dataKey="resolved" name="Résolus" radius={[4, 4, 0, 0]} fill="#22c55e" maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Page principale : Reports                       */
/* ─────────────────────────────────────────────── */

export const Reports: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [availableWeeks, setAvailableWeeks] = useState<WeeklyReportPeriod[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleNames = user?.roles?.map((r) => r.name) ?? [];
  const isAdmin = roleNames.includes('ADMIN');

  // ── Charger la liste des semaines disponibles ──
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const weeks = await api.getAvailableWeeks();
        setAvailableWeeks(weeks);
        if (weeks.length > 0 && !selectedWeek) {
          setSelectedWeek(`${weeks[0].year}-W${String(weeks[0].weekNumber).padStart(2, '0')}`);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchWeeks();
  }, []);

  // ── Charger le rapport pour la semaine sélectionnée ──
  useEffect(() => {
    if (!selectedWeek) return;
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getWeeklyReport(selectedWeek);
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedWeek]);

  // ── Export PDF ──
  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      const blob = await api.exportWeeklyReportPdf(selectedWeek);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const label = report?.period.label?.replace(/\s/g, '_') ?? 'rapport';
      a.download = `rapport_hebdo_${label}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExportingPdf(false);
    }
  }, [selectedWeek, report]);

  // ── Export Excel ──
  const handleExportExcel = useCallback(async () => {
    setExportingExcel(true);
    try {
      const blob = await api.exportWeeklyReportExcel(selectedWeek);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const label = report?.period.label?.replace(/\s/g, '_') ?? 'rapport';
      a.download = `rapport_hebdo_${label}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExportingExcel(false);
    }
  }, [selectedWeek, report]);

  // ── Synthèse pour les graphiques ──
  const chartData = useMemo(() => {
    if (!report) return null;
    const serviceData = report.byService.slice(0, 8).map((s) => ({
      name: s.name,
      Créés: s.created,
      Résolus: s.resolved,
    }));
    const priorityPieData = report.byPriority.map((p) => ({
      name: p.name,
      value: p.created + p.resolved,
    }));
    return { serviceData, priorityPieData };
  }, [report]);

  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
    color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    borderRadius: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
  };

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 size={32} className="animate-spin text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement du rapport...</p>
      </div>
    );
  }

  return (
    <div className="p-6 xl:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl xl:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Rapports Hebdomadaires
          </h1>
          <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400 mt-1">
            Taux de résolution, tendances et comparaison semaine par semaine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WeekSelector
            weeks={availableWeeks}
            current={selectedWeek}
            onChange={setSelectedWeek}
          />
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleExportPdf}
          disabled={exportingPdf || loading || !report}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-semibold shadow-sm transition-all duration-150 disabled:cursor-not-allowed"
        >
          {exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {exportingPdf ? 'Génération...' : '📄 Exporter le rapport PDF'}
        </button>
        <button
          onClick={handleExportExcel}
          disabled={exportingExcel || loading || !report}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-sm font-semibold shadow-sm transition-all duration-150 disabled:cursor-not-allowed"
        >
          {exportingExcel ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exportingExcel ? 'Génération...' : '📊 Exporter Excel'}
        </button>

        {report && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
            Mis à jour en temps réel
          </span>
        )}
      </div>

      {/* ── ERREUR ── */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── CONTENU DU RAPPORT ── */}
      {report && (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="Incidents créés"
              value={report.kpi.created}
              subtitle="Nouveaux déclarés cette semaine"
              icon={AlertCircle}
              color="blue"
              comparison={
                report.comparison && <VariantBadge value={report.comparison.createdChange} />
              }
            />
            <KpiCard
              title="Incidents résolus"
              value={report.kpi.resolved}
              subtitle={report.kpi.extraResolvedFromStock > 0 ? `Dont ${report.kpi.extraResolvedFromStock} d'anciens stocks` : 'Traités cette semaine'}
              icon={CheckCircle2}
              color="emerald"
              comparison={
                report.comparison && <VariantBadge value={report.comparison.resolvedChange} />
              }
            />
            <KpiCard
              title="Taux de résolution"
              value={formatRate(report.kpi.resolutionRate, report.kpi.cappedRate)}
              subtitle={report.kpi.resolutionRate !== null && report.kpi.resolutionRate > 100 ? `Taux réel : ${report.kpi.resolutionRate.toFixed(1)}%` : undefined}
              icon={TrendingUp}
              color="amber"
              comparison={
                report.comparison && (
                  <VariantBadge value={report.comparison.resolutionRateChange} unit="pts" />
                )
              }
              note={report.kpi.extraResolvedFromStock > 0 ? `Dont ${report.kpi.extraResolvedFromStock} résolu(s) d'anciens stocks` : undefined}
            />
            <KpiCard
              title="Incidents en cours"
              value={report.kpi.backlogEnd}
              subtitle={`En début de semaine : ${report.kpi.backlogStart}`}
              icon={Layers3}
              color="slate"
              comparison={
                report.comparison && (
                  <VariantBadge value={report.comparison.backlogEndChange} inverse />
                )
              }
            />
          </div>

          {/* ── KPIs temporels ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Temps moyen de résolution"
              value={formatHours(report.kpi.avgResolutionHours)}
              subtitle="Délai création → résolution"
              icon={Clock}
              color="slate"
              comparison={
                report.comparison && (
                  <VariantBadge value={report.comparison.avgResolutionChange} inverse />
                )
              }
            />
            <KpiCard
              title="Temps moyen de prise en charge"
              value={formatHours(report.kpi.avgTakeInChargeHours)}
              subtitle="Délai création → prise en charge"
              icon={Clock}
              color="slate"
            />
          </div>

          {/* ── COMPARAISON S-1 ── */}
          <Card
            title="📈 Comparaison S-1"
            description="Analyse détaillée des écarts entre la semaine courante et la semaine précédente"
          >
            {report.comparison ? (
              <ComparisonTable kpi={report.kpi} comparison={report.comparison} />
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                Aucune donnée de comparaison disponible (première semaine ou historique insuffisant).
              </p>
            )}
          </Card>

          {/* ── TREND JOURNALIER + PRIORITÉ ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card
              title="📊 Tendance journalière"
              description="Évolution des créés et résolus jour par jour"
              className="xl:col-span-2"
            >
              <TrendChart data={report.dailyTrend} />
            </Card>

            <Card
              title="🎯 Répartition par priorité"
              description="Volume total (créés + résolus) par criticité"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData?.priorityPieData ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData?.priorityPieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PALETTE_PRIORITY[entry.name] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Tableau de bord priorité */}
              {report.byPriority.length > 0 && (
                <div className="mt-4 space-y-2">
                  {report.byPriority.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PALETTE_PRIORITY[p.name] || '#94a3b8' }}
                        />
                        <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{p.created} créés</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{p.resolved} résolus</span>
                        <span className="font-semibold text-slate-900 dark:text-white w-14 text-right">
                          {p.rate !== null ? `${p.rate.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── PAR SERVICE ── */}
          <Card
            title="🏢 Répartition par service / site"
            description="Volume d'incidents créés et résolus par service déclarant"
          >
            {report.byService.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left py-3.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Service</th>
                      <th className="text-right py-3.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Créés</th>
                      <th className="text-right py-3.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Résolus</th>
                      <th className="text-right py-3.5 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Taux</th>
                      <th className="py-3.5 px-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {report.byService.map((s) => {
                      const rate = s.rate ?? 0;
                      return (
                        <tr key={s.name} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                          <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">{s.created}</td>
                          <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{s.resolved}</td>
                          <td className="py-3.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                            {s.rate !== null ? `${s.rate.toFixed(1)}%` : 'N/A'}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(rate, 100)}%`,
                                  backgroundColor: rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Aucun incident cette semaine.</p>
            )}
          </Card>
        </>
      )}

      {/* ── ÉTAT VIDE ── */}
      {!report && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BarChart3 size={48} className="text-slate-300 dark:text-slate-700" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sélectionne une semaine pour visualiser le rapport.
          </p>
        </div>
      )}
    </div>
  );
};
