import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Incident, Task } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { ArrowLeft, Calendar, User as UserIcon, CheckSquare, Plus, AlertTriangle, Link as LinkIcon, Clock, Edit2, Trash2, XCircle, FileSpreadsheet, FileText, Paperclip, X, UploadCloud, Upload, Loader2, Download } from 'lucide-react';
import { IncidentAttachment } from '@/src/types/attachment';
import { useAuth } from '../src/types/auth/AuthContext';

export const IncidentDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [incident, setIncident] = useState<Incident | undefined>(undefined);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    const [incidentAttachments, setIncidentAttachments] =
        useState<IncidentAttachment[]>([]);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadingTaskId, setDownloadingTaskId] = useState<number | null>(null);
    const { user, isLoading: authLoading } = useAuth();
    const [glpiTicketContent, setGlpiTicketContent] = useState<string>("");
    const [comments, setComments] = useState<any[]>([]);

    // --- Ajout logique bouton rouvrir ---
    const [reopenLoading, setReopenLoading] = useState(false);
    const canReopenIncident = incident && (incident.status === 'CLOSED' || incident.status === 'CANCELLED');
    const handleReopenIncident = async () => {
        if (!incident) return;
        if (!window.confirm("Voulez-vous vraiment rouvrir cet incident ?")) return;
        setReopenLoading(true);
        try {
            // @ts-ignore
            await api.reopenIncident(incident.id);
            // Recharge l’incident
            const updated = await api.getIncidentById(incident.id);
            setIncident(updated);
        } catch (e: any) {
            alert(e?.message || "Erreur lors de la réouverture de l’incident.");
        } finally {
            setReopenLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                const inc = await api.getIncidentById(id);

                const taskList = await api.getTasks(String(inc.id));

                setIncident(inc);
                if (inc?.glpiTicketId) {
                    try {
                        const ticket = await api.getGlpiTicketById(Number(inc.glpiTicketId));
                        setGlpiTicketContent(ticket?.content ? String(ticket.content) : "");
                    } catch {
                        setGlpiTicketContent("");
                    }
                } else {
                    setGlpiTicketContent("");
                }
                setTasks(taskList);
                setLoading(false);
                setComments(Array.isArray((inc as any).comments) ? (inc as any).comments : []);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const fetchAttachments = async () => {
            try {
                const attachments = await api.getIncidentAttachments(id);

                setIncidentAttachments(attachments);
            } catch (err) {

                setIncidentAttachments([]);
            }
        };

        fetchAttachments();
    }, [id]);

    const getTaskCreatorId = (task: any): number | null => {
        const rawCreatorId =
            task?.createdById ??
            task?.creatorId ??
            task?.userId ??
            task?.authorId ??
            task?.ownerId ??
            task?.reporterId ??
            task?.createdBy?.id ??
            task?.creator?.id ??
            task?.user?.id ??
            task?.author?.id ??
            task?.owner?.id;

        if (rawCreatorId === null || rawCreatorId === undefined || rawCreatorId === '') {
            return null;
        }

        const parsed = Number(rawCreatorId);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const isTaskCreator = (task: Task) => {
        if (!user) return false;
        const creatorId = getTaskCreatorId(task as any);
        if (creatorId === null) return false;
        return Number(user.id) === creatorId;
    };

    const getTaskActionTitle = (task: Task, actionLabel: string) => {
        if (!user) return "Utilisateur non chargé";
        if (getTaskCreatorId(task as any) === null) {
            return `Impossible de déterminer le créateur de la tâche pour ${actionLabel.toLowerCase()}`;
        }
        if (!isTaskCreator(task)) {
            return `Seul le créateur de la tâche peut ${actionLabel.toLowerCase()}`;
        }
        return actionLabel;
    };

    const handleCancelIncident = async () => {
        if (
            incident &&
            window.confirm("CONFIRMATION REQUISE : Êtes-vous sûr de vouloir ANNULER cet incident ?")
        ) {
            const formData = new FormData();
            formData.append('status', 'CANCELLED');

            const updated = await api.updateIncident(incident.id, formData);
            setIncident(updated);
        }
    };

    const handleDeleteIncident = async () => {
        if (incident && window.confirm("DANGER : Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT cet incident ? Cette action est irréversible.")) {
            await api.deleteIncident(incident.id);
            navigate('/incidents');
        }
    };

    const handleEditIncident = () => {
        if (incident) {
            navigate(`/incidents/${incident.id}/edit`);
        }
    };

    const handleAddTask = () => {
        if (!incident) return;

        if (incident.status !== "OPEN") {
            alert("Impossible d'ajouter une tâche : l'incident doit être au statut OPEN.");
            return;
        }

        navigate(`/incidents/${id}/tasks/new`);
    };

    const handleEditTask = (task: Task) => {
        if (!isTaskCreator(task)) {
            alert("Seul le créateur de la tâche peut la modifier.");
            return;
        }

        navigate(`/incidents/${id}/tasks/${task.id}/edit`);
    };

    const handleDeleteTask = async (task: Task) => {
        if (!isTaskCreator(task)) {
            alert("Seul le créateur de la tâche peut la supprimer.");
            return;
        }

        const confirmed = window.confirm(
            "Êtes-vous sûr de vouloir supprimer cette tâche ?"
        );
        if (!confirmed) return;

        try {
            await api.deleteTask(String(task.id)); // API = string URL
            setTasks(prev => prev.filter(item => item.id !== task.id));
        } catch (error) {
            alert("Erreur lors de la suppression de la tâche");
        }
    };

    const handleDeleteTaskAttachments = async (task: Task) => {
        if (!isTaskCreator(task)) {
            alert("Seul le créateur de la tâche peut vider ses pièces jointes.");
            return;
        }

        if (!window.confirm("Voulez-vous supprimer toutes les pièces jointes associées à cette tâche ?")) {
            return;
        }

        try {
            await api.deleteTaskAttachments(String(task.id));

            setTasks(prev =>
                prev.map(item =>
                    item.id === task.id
                        ? { ...item, attachments: [] }
                        : item
                )
            );

        } catch (error: any) {
            alert("Erreur lors de la suppression des pièces jointes");
        }
    };

    const handleAddTaskAttachments = (task: Task) => {
        if (!isTaskCreator(task)) {
            alert("Seul le créateur de la tâche peut ajouter des pièces jointes.");
            return;
        }

        navigate(`/incidents/${id}/tasks/${task.id}/attachments`);
    };

    const handleDownloadTaskAttachments = async (task: Task) => {
        if (!task.attachments || task.attachments.length === 0) {
            alert("Aucune pièce jointe à télécharger");
            return;
        }

        try {
            setDownloadingTaskId(task.id);

            await new Promise(resolve => setTimeout(resolve, 0));

            for (const att of task.attachments) {
                const link = document.createElement("a");
                link.href = att.url;
                link.download = att.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            alert("Erreur lors du téléchargement");
        } finally {
            setDownloadingTaskId(null);
        }
    };

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = (e: React.MouseEvent, incident: Incident) => {
        e.stopPropagation();

        const formatValue = (value: any) => {
            if (value === null || value === undefined) return "";
            if (value instanceof Date) return `"${value.toLocaleDateString("fr-FR")}"`;
            if (typeof value === "string" && !isNaN(Date.parse(value))) {
                return `"${new Date(value).toLocaleDateString("fr-FR")}"`;
            }
            return `"${String(value).replace(/"/g, '""')}"`;
        };

        const sites = incident.sites?.map((s) => s.name).join(", ") ?? "";
        const glpiTicketNumber = incident.glpiTicketId ? String(incident.glpiTicketId) : "";

        const rows = [
            [
                "Nom du déclarant",
                "Ticket GLPI",
                "Référence",
                "Description",
                "Statut",
                "Priorité",
                "Service émetteur",
                "Site récepteur",
                "Échéance",
                "Créé le",
            ],
            [
                incident.reporterName ?? "",
                glpiTicketNumber,
                incident.reference ?? "",
                incident.description ?? "",
                incident.status ?? "",
                incident.urgency ?? "",
                incident.serviceEmitter ?? "",
                sites,
                incident.dueDate ? new Date(incident.dueDate) : "",
                new Date(incident.createdAt),
            ],
        ];

        const csvContent = rows
            .map((row) => row.map(formatValue).join(";"))
            .join("\n");

        downloadFile(
            csvContent,
            `incident_${incident.reference}.csv`,
            "text/csv;charset=utf-8;"
        );
    };

    const handleExportPDF = async (
        e: React.MouseEvent,
        incident: Incident
    ) => {
        e.stopPropagation();

        try {

            setDownloadingId(incident.id);
            const pdfBlob = await api.getIncidentReportPdf(incident.id);

            const url = URL.createObjectURL(pdfBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `FICHE_INCIDENT_${incident.reference}.pdf`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error: any) {
            alert(error.message || 'Impossible de générer le PDF');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleAttachmentClick = async (att: IncidentAttachment) => {
        if (!incident) return;
        try {
            const blob = await api.getIncidentAttachment(
                incident.id,
                att.id
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = att.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert("Impossible de télécharger le fichier");
        }
    };

    const handleDeleteIncidentAttachment = async (
        attachmentId: string,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();

        if (!incident || !user) return;

        if (Number(user.id) !== Number(incident.reporterId)) {
            alert("Seul le déclarateur de l'incident peut supprimer une pièce jointe.");
            return;
        }

        if (incident.status !== "OPEN") {
            alert("Suppression impossible : l'incident doit être au statut OPEN.");
            return;
        }

        if (!window.confirm("Supprimer la pièce jointe ?")) return;

        const res = await api.deleteIncidentAttachment(incident.id, attachmentId);

        if (!res.ok) {
            alert("Erreur lors de la suppression");
            return;
        }

        setIncidentAttachments(prev => prev.filter(att => att.id !== attachmentId));
    };

    const handleAddIncidentAttachment = () => {
        if (!incident || !user) return;

        if (Number(user.id) !== Number(incident.reporterId)) {
            alert("Seul le déclarateur de l'incident peut ajouter des pièces jointes.");
            return;
        }

        if (incident.status !== "OPEN") {
            alert("Impossible d'ajouter une pièce jointe : l'incident doit être au statut OPEN.");
            return;
        }

        navigate(`/incidents/${id}/attachments`);
    };

    const isPageReady = !loading && !authLoading && !!incident;

    if (!isPageReady) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div>
            </div>
        );
    }

    const canAddTask = incident.status === "OPEN";

    const PropertyRow = ({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
        <div className="flex items-start py-2 group">
            <div className="w-32 flex-shrink-0 flex items-center text-xs text-slate-500 dark:text-slate-400">
                {Icon && <Icon className="h-3.5 w-3.5 mr-2 text-slate-400 dark:text-slate-500" />}
                {label}
            </div>
            <div className="flex-1 text-sm text-slate-900 dark:text-slate-200 font-medium break-words">
                {value}
            </div>
        </div>
    );

    const urgencyToPriority = (urgency: Incident['urgency']) => {
        switch (urgency) {
            case 'Faible':
                return 'LOW';
            case 'Moyenne':
                return 'MEDIUM';
            case 'Haute':
                return 'HIGH';
            case 'Immédiate':
                return 'CRITICAL';
            default:
                return 'LOW';
        }
    };

    const canManageIncident =
        !!incident &&
        !!user &&
        incident.status !== 'CLOSED' &&
        incident.status !== 'CANCELLED' &&
        Number(user.id) === Number(incident.reporterId);

    const isReporter =
        !!incident &&
        !!user &&
        Number(user.id) === Number(incident.reporterId);

    const canAddIncidentAttachments =
        isReporter && incident.status === "OPEN";

    const isReporterDelete =
        !!incident &&
        !!user &&
        Number(user.id) === Number(incident.reporterId);

    const canDeleteIncidentAttachments =
        isReporterDelete && incident.status === "OPEN";

    const handleBack = () => {
        navigate('/incidents');
    };

    const formatDateTime = (d: any) => {
        try {
            return new Date(d).toLocaleString("fr-FR", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 lg:bg-slate-50/50 lg:dark:bg-slate-950 transition-colors duration-200">

            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200 print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md hover:-translate-x-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 transition-all"
                        aria-label="Retour à la liste des incidents"
                        title="Retour à la liste des incidents"
                    >
                        <ArrowLeft className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        <span>Revenir à la liste des incidents</span>
                    </button>

                    <div className="flex items-center text-sm">
                        <span className="font-mono text-slate-500 dark:text-slate-400 mr-3">{incident.reference}</span>
                        <span className="text-slate-300 dark:text-slate-700 mr-3">|</span>
                        <StatusBadge status={incident.status} />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canReopenIncident && (
                        <button
                            onClick={handleReopenIncident}
                            disabled={reopenLoading}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-700 hover:text-blue-900 dark:hover:text-blue-400 transition-all shadow-sm"
                            aria-label="Rouvrir l’incident"
                            title="Rouvrir l’incident"
                        >
                            {reopenLoading ? (
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
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
                        title="Générer un fichier PDF"
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
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-green-600 dark:hover:text-green-400 transition-all shadow-sm mr-4"
                        title="Générer un fichier Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span>Export Excel</span>
                    </button>

                    {canManageIncident && (
                        <>
                            <button onClick={handleEditIncident} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                                <Edit2 className="h-3.5 w-3.5" /> Modifier l'incident
                            </button>

                            <button onClick={handleCancelIncident} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                                <XCircle className="h-3.5 w-3.5" /> Annuler
                            </button>

                            <button onClick={handleDeleteIncident} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/30 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-10">

                    <div className="lg:col-span-8">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight mb-6">{incident.description}</h1>

                        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Description & Tâches
                            </button>
                        </div>

                        {activeTab === 'details' ? (

                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Description</h3>
                                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {incident.description}
                                    </div>
                                </div>

                                {/* PREMIUM: Utilisateurs GLPI assignés */}
                                {Array.isArray((incident as any).glpiUsers) && (incident as any).glpiUsers.length > 0 && (
                                  <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Utilisateurs GLPI assignés</h3>
                                    <ul className="flex flex-wrap gap-2">
                                      {(incident as any).glpiUsers.map((user: any) => (
                                        <li key={user.id} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-200">
                                          {user.fullName || user.firstname + ' ' + user.realname || user.login || user.email || `Utilisateur #${user.id}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {incident.rootCause && (
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Cause racine</h3>
                                        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {incident.rootCause}
                                        </div>
                                    </div>
                                )}

                                {incident.proposedSolution && (
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Solution proposée</h3>
                                        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {incident.proposedSolution}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pièces jointes</h3>
                                        {(() => {
                                            const isOpen = incident.status === "OPEN";
                                            const canAdd = isReporter && isOpen;

                                            const title = canAdd
                                                ? "Ajouter des pièces jointes"
                                                : !isReporter
                                                    ? "Seul le déclarateur peut ajouter des pièces jointes"
                                                    : "Ajout impossible : l'incident doit être OPEN";

                                            return (
                                                <button
                                                    type="button"
                                                    onClick={canAdd ? handleAddIncidentAttachment : undefined}
                                                    disabled={!canAdd}
                                                    className={
                                                        canAdd
                                                            ? "flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm text-xs"
                                                            : "flex items-center gap-2 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-md font-medium text-xs cursor-not-allowed opacity-80"
                                                    }
                                                    title={title}
                                                >
                                                    <UploadCloud className="h-4 w-4" />
                                                    <span>Ajouter des pièces jointes</span>
                                                </button>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {incidentAttachments.map(att => (
                                            <div
                                                key={att.id}
                                                onClick={() => handleAttachmentClick(att)}
                                                className="relative group flex items-center gap-3 p-2 pr-4 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer"
                                            >
                                                {canDeleteIncidentAttachments && (
                                                    <button
                                                        onClick={(e) => handleDeleteIncidentAttachment(att.id, e)}
                                                        className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full"
                                                        title="Supprimer"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}

                                                <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center">
                                                    <span className="text-[10px] font-bold">
                                                        {att.mimeType?.split('/')?.[1]?.toUpperCase() ?? 'FILE'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium">{att.fileName}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {incidentAttachments.length === 0 && <span className="text-sm text-slate-400 italic">Aucune pièce jointe.</span>}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Sous-tâches
                                        </h3>
                                        <button
                                            onClick={handleAddTask}
                                            disabled={!canAddTask}
                                            title={
                                                canAddTask
                                                    ? "Ajouter une tâche"
                                                    : "Ajout impossible : l'incident doit être OPEN"
                                            }
                                            className={[
                                                "text-xs px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm",
                                                canAddTask
                                                    ? "bg-brand-600 hover:bg-brand-700 text-white"
                                                    : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-80"
                                            ].join(" ")}
                                        >
                                            <Plus className="h-3 w-3" /> Ajouter tâche
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                                        {tasks.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                                Aucune tâche associée
                                            </div>
                                        ) : (
                                            <table className="w-full table-fixed divide-y divide-slate-200 dark:divide-slate-800">
                                                <thead className="bg-slate-50 dark:bg-slate-950">
                                                    <tr>
                                                        <th className="w-24 px-2 py-3 text-left text-xs uppercase">
                                                            Titre
                                                        </th>

                                                        <th className="w-28 px-2 py-3 text-left text-xs uppercase">
                                                            Description
                                                        </th>

                                                        <th className="w-[400px] px-2 py-3 text-right text-xs uppercase">
                                                            Actions
                                                        </th>

                                                        <th className="w-24 px-2 py-3 text-left text-xs uppercase">
                                                            Échéance
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                                    {tasks.map((task) => {
                                                        const canManageTask = isTaskCreator(task);

                                                        return (
                                                            <tr
                                                                key={task.id}
                                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                            >
                                                                <td className="px-2 py-3 align-top">
                                                                    <span
                                                                        className={`text-sm font-medium whitespace-pre-wrap break-words ${task.status === 'DONE'
                                                                            ? 'text-slate-400 dark:text-slate-600 line-through'
                                                                            : 'text-slate-900 dark:text-slate-100'
                                                                            }`}
                                                                    >
                                                                        {task.name}
                                                                    </span>
                                                                </td>

                                                                <td className="px-2 py-3 align-top">
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words">
                                                                        {task.description || '-'}
                                                                    </span>
                                                                </td>

                                                                <td className="px-4 py-4 align-top text-right">
                                                                    <div className="flex flex-col gap-2 items-end">
                                                                        <button
                                                                            onClick={() => handleAddTaskAttachments(task)}
                                                                            disabled={!canManageTask}
                                                                            title={getTaskActionTitle(task, "Ajouter des pièces jointes")}
                                                                            className={[
                                                                                "w-40 px-2 py-1 text-xs font-medium border rounded",
                                                                                canManageTask
                                                                                    ? "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                                                                                    : "text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed opacity-70 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                                            ].join(" ")}
                                                                        >
                                                                            <Upload className="h-3 w-3 inline mr-1" />
                                                                            Ajouter P.J.
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDownloadTaskAttachments(task)}
                                                                            disabled={downloadingTaskId === task.id}
                                                                            className="w-40 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded 
                                                                                dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/50 
                                                                                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                                                        >
                                                                            {downloadingTaskId === task.id ? (
                                                                                <>
                                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                                    Téléchargement...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Download className="h-3 w-3" />
                                                                                    Télécharger
                                                                                </>
                                                                            )}
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDeleteTaskAttachments(task)}
                                                                            disabled={!canManageTask}
                                                                            title={getTaskActionTitle(task, "Vider les pièces jointes")}
                                                                            className={[
                                                                                "w-40 px-2 py-1 text-xs font-medium border rounded",
                                                                                canManageTask
                                                                                    ? "text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/50"
                                                                                    : "text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed opacity-70 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                                            ].join(" ")}
                                                                        >
                                                                            <X className="h-3 w-3 inline mr-1" />
                                                                            Vider
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleEditTask(task)}
                                                                            disabled={!canManageTask}
                                                                            title={getTaskActionTitle(task, "Modifier")}
                                                                            className={[
                                                                                "w-40 px-2 py-1 text-xs font-medium border rounded",
                                                                                canManageTask
                                                                                    ? "text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                                                                                    : "text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed opacity-70 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                                            ].join(" ")}
                                                                        >
                                                                            <Edit2 className="h-3 w-3 inline mr-1" />
                                                                            Modifier
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDeleteTask(task)}
                                                                            disabled={!canManageTask}
                                                                            title={getTaskActionTitle(task, "Supprimer")}
                                                                            className={[
                                                                                "w-40 px-2 py-1 text-xs font-medium border rounded",
                                                                                canManageTask
                                                                                    ? "text-red-700 bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                                                                                    : "text-slate-500 bg-slate-100 border-slate-200 cursor-not-allowed opacity-70 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                                            ].join(" ")}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 inline mr-1" />
                                                                            Supprimer
                                                                        </button>
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3 whitespace-nowrap align-top">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                        <span className="text-xs text-slate-600 dark:text-slate-300">
                                                                            {new Date(incident.dueDate).toISOString().slice(0, 10)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                                        Commentaires de Clôture
                                    </h3>

                                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                        {comments.length === 0 ? (
                                            <div className="p-6 text-sm text-slate-500 dark:text-slate-400 italic">
                                                Aucun commentaire.
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {comments.map((c: any) => (
                                                    <li key={c.id} className="p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                    {c.user?.username ? c.user.username : `Utilisateur #${c.userId}`}
                                                                </div>
                                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {formatDateTime(c.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                                            {c.content}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-slate-400 dark:text-slate-600 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 border-dashed">
                                Zone d'activité et commentaires (Placeholder)
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent rounded-lg p-4 lg:p-0 border lg:border-0 border-slate-200 dark:border-slate-800 shadow-sm lg:shadow-none">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Propriétés</h3>

                            <div className="space-y-1">
                                <PropertyRow
                                    label="Déclarant"
                                    icon={UserIcon}
                                    value={incident.reporterName?.trim() ? incident.reporterName : "—"}
                                />

                                <PropertyRow label="Statut" value={<StatusBadge status={incident.status} />} />
                                <PropertyRow
                                    label="Priorité"
                                    value={<PriorityBadge priority={urgencyToPriority(incident.urgency)} />}
                                />
                                <PropertyRow
                                    label="Site(s) traitant(s)"
                                    value={
                                        <div className="flex flex-wrap gap-1">
                                            {incident.sites?.length
                                                ? incident.sites.map(site => (
                                                    <span
                                                        key={site.id}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                    >
                                                        {site.name}
                                                    </span>
                                                ))
                                                : '—'}
                                        </div>
                                    }
                                />

                                <PropertyRow
                                    label="Assigné à"
                                    icon={UserIcon}
                                    value={
                                        incident.personnes && incident.personnes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {incident.personnes.map(personne => (
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
                                        )
                                    }
                                />

                                <PropertyRow label="Site(s) concerné(s)"
                                    value={
                                        <div className="flex flex-wrap gap-1">
                                            {incident.impactedSites?.length
                                                ? incident.impactedSites.map(site => (
                                                    <span
                                                        key={site.id}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                    >
                                                        {site.name}
                                                    </span>
                                                ))
                                                : '—'}
                                        </div>
                                    }
                                />
                                <PropertyRow label="Échéance" value={new Date(incident.dueDate).toLocaleDateString()} icon={Calendar} />
                                <PropertyRow label="Créé le" value={new Date(incident.createdAt).toLocaleDateString()} icon={Clock} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent rounded-lg p-4 lg:p-0 border lg:border-0 border-slate-200 dark:border-slate-800 shadow-sm lg:shadow-none">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Contexte</h3>
                            <div className="space-y-1">
                                <PropertyRow label="Site(s) concerné(s)"
                                    value={
                                        <div className="flex flex-wrap gap-1">
                                            {incident.impactedSites?.length
                                                ? incident.impactedSites.map(site => (
                                                    <span
                                                        key={site.id}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                    >
                                                        {site.name}
                                                    </span>
                                                ))
                                                : '—'}
                                        </div>
                                    }
                                />
                                <PropertyRow label="Catégorie" value={incident.category ?? '—'} />
                                <PropertyRow
                                    label="Sous Catégorie"
                                    value={
                                        incident.subCategory
                                        ?? incident.otherSubCategory
                                        ?? '—'
                                    }
                                />
                                <PropertyRow label="Processus" value={incident.processDomain ?? '—'} />
                                <PropertyRow label="Sous Processus" value={incident.subProcess ?? '—'} />
                                <PropertyRow label="Périmètre" value={incident.scope ?? '—'} />

                                {incident.glpiTicketId ? (
                                    <PropertyRow
                                        label="Ticket GLPI"
                                        value={
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        ID :
                                                    </span>
                                                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                                                        {String(incident.glpiTicketId)}
                                                    </span>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                        Titre :
                                                    </span>
                                                    <span className="text-sm text-slate-900 dark:text-slate-200 whitespace-pre-wrap break-words">
                                                        {glpiTicketContent?.trim() ? glpiTicketContent : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        }
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
