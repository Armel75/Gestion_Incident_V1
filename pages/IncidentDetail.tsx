import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Incident, Task, UserRole } from '../types';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { ArrowLeft, Calendar, User as UserIcon, CheckSquare, Plus, AlertTriangle, Link as LinkIcon, Clock, Edit2, Trash2, XCircle, FileSpreadsheet, FileText, Paperclip, X, UploadCloud, Upload } from 'lucide-react';
import { IncidentAttachment } from '@/src/types/attachment';

export const IncidentDetail: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [incident, setIncident] = useState<Incident | undefined>(undefined);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
    //const [incidentAttachments, setIncidentAttachments] = useState<string[]>([]);
    const [incidentAttachments, setIncidentAttachments] =
        useState<IncidentAttachment[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                const inc = await api.getIncidentById(id);
                console.log(inc);
                console.log('INCIDENT DB ID 👉', inc.id);
                const taskList = await api.getTasks(String(inc.id));
                console.log(taskList);
                setIncident(inc);
                setTasks(taskList);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
    if (!id) return;

    const fetchAttachments = async () => {
        try {
        const attachments = await api.getIncidentAttachments(id);

        console.log('ATTACHMENTS API 👉', attachments);

        setIncidentAttachments(attachments);
        } catch (err) {
        console.error('Failed to load attachments', err);
        setIncidentAttachments([]);
        }
    };

    fetchAttachments();
    }, [id]);

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
        navigate(`/incidents/${id}/tasks/new`);
    };

    const handleEditTask = (taskId: string) => {
        navigate(`/incidents/${id}/tasks/${taskId}/edit`);
    };

    const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette tâche ?"
    );
    if (!confirmed) return;

    try {
        await api.deleteTask(String(taskId)); // API = string URL
        setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
        alert("Erreur lors de la suppression de la tâche");
        console.error(error);
    }
    };

    const handleDeleteTaskAttachments = async (taskId: string) => {
        if (window.confirm("Voulez-vous supprimer toutes les pièces jointes associées à cette tâche ?")) {
            alert("Pièces jointes supprimées pour la tâche " + taskId);
        }
    };

    const handleAddTaskAttachments = (taskId: string) => {
        // Changed to navigate to the dedicated attachment page for tasks
        navigate(`/incidents/${id}/tasks/${taskId}/attachments`);
    };

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
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
        if (value === null || value === undefined) return '';
        if (value instanceof Date) {
            return value.toLocaleDateString('fr-FR');
        }
        return `"${String(value).replace(/"/g, '""')}"`;
        };

        const rows = [
        ['Référence', 'Description', 'Statut', 'Priorité', 'Sites', 'Créé le'],
        [
            incident.reference,
            incident.description,
            incident.status,
            incident.urgency,
            incident.sites.map(s => s.name).join(', ') ?? '',
            new Date(incident.createdAt),
        ],
        ];

        const csvContent = rows
        .map(row => row.map(formatValue).join(';')) // ✅ séparateur Excel FR
        .join('\n');

        downloadFile(
        csvContent,
        `incident_${incident.reference}.csv`,
        'text/csv;charset=utf-8;'
        );
    };


    const handleExportPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!incident) return;

    try {
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
        console.error(error);
        alert(error.message || 'Impossible de générer le PDF');
    }
    };

    const handleAttachmentClick = (att: IncidentAttachment) => {
    window.open(att.url, '_blank');
    };


    const handleDeleteIncidentAttachment = async (
    attachmentId: string,
    e: React.MouseEvent
    ) => {
    e.stopPropagation();

    if (!window.confirm("Supprimer la pièce jointe ?")) return;

    const res = await api.deleteIncidentAttachment(incident.id, attachmentId);

    if (!res.ok) {
        console.error('DELETE attachment failed', await res.text());
        alert("Erreur lors de la suppression");
        return;
    }

    setIncidentAttachments(prev =>
        prev.filter(att => att.id !== attachmentId)
    );
    };

    const handleAddIncidentAttachment = () => {
        navigate(`/incidents/${id}/attachments`);
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 dark:border-slate-400"></div></div>;
    if (!incident) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Incident non trouvé</div>;

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

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 lg:bg-slate-50/50 lg:dark:bg-slate-950 transition-colors duration-200">

            {/* Top Bar - Actions and Context */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/incidents')} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center text-sm">
                        <span className="font-mono text-slate-500 dark:text-slate-400 mr-3">{incident.reference}</span>
                        <span className="text-slate-300 dark:text-slate-700 mr-3">|</span>
                        <StatusBadge status={incident.status} />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
                        title="Générer un fichier PDF"
                    >
                        <FileText className="h-4 w-4 text-red-500" />
                        <span>Export PDF</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-green-600 dark:hover:text-green-400 transition-all shadow-sm mr-4"
                        title="Générer un fichier Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        <span>Export Excel</span>
                    </button>

                    {userRole === 'ARBITRE' && incident.status !== 'CLOSED' && (
                        <button className="text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 transition-colors">
                            <AlertTriangle className="h-3.5 w-3.5" /> Forcer Clôture
                        </button>
                    )}

                    <button onClick={handleEditIncident} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" /> Modifier
                    </button>

                    <button onClick={handleCancelIncident} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors">
                        <XCircle className="h-3.5 w-3.5" /> Annuler
                    </button>

                    <button onClick={handleDeleteIncident} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/30 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Main Content (8 cols) */}
                    <div className="lg:col-span-8">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight mb-6">{incident.description}</h1>

                        {/* Tabs */}
                        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Description & Tâches
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity' ? 'border-brand-600 dark:border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Activité <span className="ml-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full"></span>
                            </button>
                        </div>

                        {activeTab === 'details' ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* Description */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Description</h3>
                                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {incident.description}
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pièces jointes</h3>
                                        <button
                                            onClick={handleAddIncidentAttachment}
                                            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm text-xs"
                                            title="Accéder à la page d'ajout de fichiers"
                                        >
                                            <UploadCloud className="h-4 w-4" />
                                            <span>Ajouter des pièces jointes</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {/* {incidentAttachments.map(fileName => (
                                            <div key={fileName} onClick={() => handleAttachmentClick(fileName)} className="relative group flex items-center gap-3 p-2 pr-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer bg-white dark:bg-slate-900 transition-all">
                                                <button
                                                    onClick={(e) => handleDeleteIncidentAttachment(fileName, e)}
                                                    className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                                                    title="Supprimer la pièce jointe"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">PNG</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">{fileName}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500"></p>
                                                </div>
                                            </div>
                                        ))} */}
                                        {incidentAttachments.map(att => (
                                        <div
                                            key={att.id}
                                            onClick={() => handleAttachmentClick(att)}
                                            className="relative group flex items-center gap-3 p-2 pr-4 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer"
                                        >
                                            <button
                                            onClick={(e) => handleDeleteIncidentAttachment(att.id, e)}
                                            className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full"
                                            >
                                            <X className="h-3 w-3" />
                                            </button>

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

                                {/* Tasks */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Sous-tâches</h3>
                                        <button onClick={handleAddTask} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm">
                                            <Plus className="h-3 w-3" /> Ajouter tâche
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                        {tasks.length === 0 ? (
                                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Aucune tâche associée</div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                                <thead className="bg-slate-50 dark:bg-slate-950">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">Titre</th>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">Échéance</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[280px]">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                                                    {tasks.map((task) => (
                                                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-4 py-3 align-top">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`flex-shrink-0 h-4 w-4 rounded border ${task.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'} flex items-center justify-center`}>
                                                                        <CheckSquare className="h-3 w-3 fill-current" />
                                                                    </div>
                                                                    <span className={`text-sm font-medium ${task.status === 'DONE' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-900 dark:text-slate-100'}`}>
                                                                        {task.name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                                    {task.description || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap align-top">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                                                        {new Date(incident.dueDate).toISOString().slice(0, 10)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right align-top">
                                                                <div className="flex flex-col gap-2 items-end sm:flex-row sm:items-center sm:justify-end sm:flex-wrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleAddTaskAttachments(task.id)}
                                                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
                                                                            title="Ajouter des pièces jointes à cette tâche"
                                                                        >
                                                                            <Upload className="h-3 w-3" /> Ajouter P.J.
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteTaskAttachments(task.id)}
                                                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/50"
                                                                            title="Supprimer toutes les pièces jointes de cette tâche"
                                                                        >
                                                                            <X className="h-3 w-3" /> Vider P.J.
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditTask(task.id)}
                                                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                                                                            title="Modifier les informations de la tâche"
                                                                        >
                                                                            <Edit2 className="h-3 w-3" /> Modifier
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteTask(task.id)}
                                                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/50"
                                                                            title="Supprimer définitivement la tâche"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" /> Supprimer
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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

                    {/* Right Column: Properties Sidebar (4 cols) - Sticky */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent rounded-lg p-4 lg:p-0 border lg:border-0 border-slate-200 dark:border-slate-800 shadow-sm lg:shadow-none">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Propriétés</h3>

                            <div className="space-y-1">
                                <PropertyRow label="Statut" value={<StatusBadge status={incident.status} />} />
                                {/* <PropertyRow label="Priorité" value={<PriorityBadge priority={incident?.priority ?? 'DEFAULT'} />} /> */}
                                <PropertyRow
                                    label="Priorité"
                                    value={<PriorityBadge priority={urgencyToPriority(incident.urgency)} />}
                                />
                                {/* <PropertyRow label="Site(s) concerné(s)" value={
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            {incident.sites?.map(site => site.name).join(', ')}
                                        </div>
                                    </div>
                                } /> */}
                                {/* <PropertyRow
                                    label="Site(s) concerné(s)"
                                    value={
                                        incident.sites?.length
                                            ? incident.sites.map(site => site.name).join(', ')
                                            : '—'
                                    }
                                /> */}
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

                                {/* <PropertyRow label="Assigné à" value={
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            {incident.assignedTo?.username?.substring(0, 1)}
                                        </div>
                                        <span>{incident.assignedTo?.username || 'Unassigned'}</span>
                                    </div>
                                } icon={UserIcon} /> */}
                                <PropertyRow
                                    label="Assigné à"
                                    icon={UserIcon}
                                    value={
                                        incident.assignedUsers && incident.assignedUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {incident.assignedUsers.map(user => (
                                                    <div key={user.id} className="flex items-center gap-2">
                                                        <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                            {user.username.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <span>{user.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">Unassigned</span>
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
                                <PropertyRow label="Sous Catégorie" value={incident.subCategory ?? '—'} />
                                <PropertyRow label="Processus" value={incident.processDomain ?? '—'} />
                                <PropertyRow label="Sous Processus" value={incident.subProcess ?? '—'} />
                                <PropertyRow label="Périmètre" value={incident.scope ?? '—'} />
                                {/* <PropertyRow label="Lien Externe" value={<a href="#" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">JIRA-402 <LinkIcon className="h-3 w-3"/></a>} /> */}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};