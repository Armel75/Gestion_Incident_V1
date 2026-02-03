import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Save, Paperclip } from 'lucide-react';
import { Category, Incident, Priority, Process, SubCategory, User } from '../types';
import { MultiSelect } from '../components/ui/MultiSelect';
import { SearchSelect } from '../components/ui/SearchSelect';

const KEY_PROCESSES = ['Commande Client', 'Facturation', 'Expédition', 'Paie', 'Onboarding', 'Backup'];
const SERVICES = ['IT Infrastructure', 'IT Support', 'Logistique', 'Finance', 'RH', 'Services Généraux'];
const CRITICALITY = ['Faible', 'Moyenne', 'Haute', 'Critique'];
const URGENCY = ['Faible', 'Moyenne', 'Haute', 'Immédiate'];


export const NewIncident: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Check for ID to enable Edit Mode
    const [loading, setLoading] = useState(false);
    const isEditMode = !!id;

    // Form State
    const [formData, setFormData] = useState({
        site: [] as string[],
        scope: '',
        category: '',
        subCategory: '',
        otherSubCategory: '',
        processDomain: '',
        keyProcess: '',
        subProcessId: '', // Au lieu de subProcess
        description: '',
        impactedServices: [] as string[],
        criticality: 'Moyenne',
        urgency: 'Moyenne',
        responsibleServices: [] as string[],
        assignedUsers: [] as string[],
        dueDate: '',
        attachments: [] as File[],
    });

    //const [sites, setSites] = useState<string[]>([]);
    const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<Record<string, string[]>>({});
    const [processDomains, setProcessDomains] = useState<Process[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [subProcess, setSubProcess] =
        useState<Record<string, { id: string; name: string }[]>>({});

    useEffect(() => {
        if (isEditMode && id) {
            const fetchIncident = async () => {
                const incident = await api.getIncidentById(id);
                if (incident) {
                    // Populate form with existing data (Simplified mapping)
                    setFormData(prev => ({
                        ...prev,
                        description: incident.description,
                        dueDate: incident.dueDate ? incident.dueDate.split('T')[0] : '',
                        category: incident.category,
                        impactedServices: incident.service ? incident.service.split(', ') : [],
                        // Note: Other fields would need detailed mapping if they existed in the Incident type
                        // For this exercise, we keep it simple as the type is limited
                        site: incident.site ? incident.site.split(', ') : []
                    }));
                }
            };
            fetchIncident();
        }
    }, [id, isEditMode]);

    useEffect(() => {
        const fetchData = async () => {
            const [sitesData, categoriesData, subCategoriesData, processesData, usersData, subProcessData] = await Promise.all([
                api.getSites(),
                api.getCategories(),
                api.getSubCategories(),
                api.getProcesses(),
                api.getUsers(),
                api.getSubProcesses(),
            ]);
            setSites(sitesData);
            setCategories(categoriesData);
            console.log('Exemple site ID type:', typeof sites[0]?.id);

            // Debugs
            console.log('SitesData complète:', sitesData); // Vérifie si [{id: ?, name: ?}]
            if (sitesData.length > 0) {
                console.log('Type de site[0].id:', typeof sitesData[0]?.id); // Devrait être 'number' ou 'string'
            } else {
                console.error('Sites vides ! Vérifiez API /sites ou DB.');
            }

            // 🔴 TRANSFORMATION OBLIGATOIRE ICI
            const groupedSubCategories: Record<string, SubCategory[]> = {};
            const groupedSubProcesses: Record<string, { id: string; name: string }[]> = {};

            subCategoriesData.forEach(sc => {
                if (!groupedSubCategories[sc.categoryId]) {
                    groupedSubCategories[sc.categoryId] = [];
                }
                groupedSubCategories[sc.categoryId].push(sc);
            });
            setSubCategories(groupedSubCategories);

            subProcessData.forEach(sp => {
                if (!groupedSubProcesses[sp.processId]) {
                    groupedSubProcesses[sp.processId] = [];
                }
                groupedSubProcesses[sp.processId].push({
                    id: sp.id,
                    name: sp.name
                });
            });
            setSubProcess(groupedSubProcesses);

            setProcessDomains(processesData);
            setUsers(usersData);
            //setSubProcess(subProcessData);
        };
        fetchData();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'category' && { subCategory: '', otherSubCategory: '' }),
            ...(name === 'processDomain' && { subProcessId: '' }) // Reset ID
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFormData(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...Array.from(e.target.files || [])]
            }));
        }
    };

    const handleMultiSelectChange = (field: string, values: string[]) => {
        setFormData(prev => ({ ...prev, [field]: values }));

        // Clear assigned users if responsible services change and selected users are no longer valid
        // (Simplified logic here: just keep them, or clear them if services become empty)
        if (field === 'responsibleServices' && values.length === 0) {
            setFormData(prev => ({ ...prev, [field]: values, assignedUsers: [] }));
        }
    };

    const mapUrgencyToPriority = (urgency: string): Priority => {
        switch (urgency) {
            case 'Immédiate': return 'CRITICAL';
            case 'Haute': return 'HIGH';
            case 'Faible': return 'LOW';
            default: return 'MEDIUM';
        }
    };

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();

    //     // 1️⃣ Validations client
    //     if (formData.site.length === 0) {
    //         alert("Veuillez sélectionner au moins un site.");
    //         return;
    //     }

    //     if (!formData.category) {
    //         alert("Veuillez sélectionner une catégorie.");
    //         return;
    //     }

    //     if (!formData.subCategory && !formData.otherSubCategory) {
    //         alert("Sous-catégorie obligatoire.");
    //         return;
    //     }

    //     if (formData.processDomain && !formData.subProcessId) {
    //         alert("Sous-processus obligatoire si domaine sélectionné.");
    //         return;
    //     }

    //     try {
    //         setLoading(true);

    //         // =====================================================
    //         // 🟢 MODE CRÉATION → FormData (multipart)
    //         // =====================================================
    //         if (!isEditMode) {
    //             const payload = new FormData();

    //             payload.append('description', formData.description);
    //             payload.append('scope', formData.scope ?? '');
    //             payload.append('categoryId', String(formData.category));
    //             payload.append('dueDate', formData.dueDate);
    //             payload.append('urgency', formData.urgency);
    //             payload.append('criticality', formData.criticality);

    //             // Sites
    //             formData.site.forEach(siteName => {
    //                 const site = sites.find(s => s.name === siteName);
    //                 if (site) payload.append('siteIds', String(site.id));
    //             });

    //             // Sous-catégorie
    //             if (formData.otherSubCategory) {
    //                 payload.append('otherSubCategory', formData.otherSubCategory);
    //             } else {
    //                 payload.append('subCategoryId', String(formData.subCategory));
    //             }

    //             // Processus
    //             if (formData.processDomain) {
    //                 payload.append('processDomainId', String(formData.processDomain));
    //             }

    //             if (formData.subProcessId) {
    //                 payload.append('subProcessId', String(formData.subProcessId));
    //             }

    //             // Users assignés
    //             formData.assignedUsers.forEach(u => {
    //                 const user = users.find(
    //                     us => us.username === u || us.fullName === u
    //                 );
    //                 if (user) payload.append('assignedUserIds', String(user.id));
    //             });

    //             // 🔥 Pièces jointes
    //             formData.attachments.forEach(file => {
    //                 payload.append('attachments', file);
    //             });

    //             // Debug
    //             console.log('FormData envoyé :');
    //             for (const [key, value] of payload.entries()) {
    //                 console.log(key, value);
    //             }

    //             await api.createIncident(payload);
    //         }

    //         // =====================================================
    //         // 🟡 MODE ÉDITION → JSON UNIQUEMENT
    //         // =====================================================
    //         else {
    //             const updatePayload = {
    //                 description: formData.description,
    //                 scope: formData.scope ?? null,
    //                 categoryId: String(formData.category),
    //                 subCategoryId: formData.subCategory
    //                     ? String(formData.subCategory)
    //                     : undefined,
    //                 otherSubCategory: formData.otherSubCategory || undefined,
    //                 processDomainId: formData.processDomain
    //                     ? String(formData.processDomain)
    //                     : undefined,
    //                 subProcessId: formData.subProcessId
    //                     ? String(formData.subProcessId)
    //                     : undefined,
    //                 dueDate: formData.dueDate,
    //                 urgency: formData.urgency,
    //                 criticality: formData.criticality,
    //             };

    //             await api.updateIncident(id!, updatePayload);
    //         }

    //         navigate('/incidents');
    //     } catch (error: any) {
    //         console.error('Submit error:', error);
    //         alert(error?.message || 'Erreur inconnue');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();

    payload.append('description', formData.description);
    payload.append('scope', formData.scope || '');
    payload.append('categoryId', String(formData.category));
    payload.append('dueDate', formData.dueDate);
    payload.append('urgency', formData.urgency);
    payload.append('criticality', formData.criticality);

    // Sites
    formData.site.forEach(siteName => {
        const site = sites.find(s => s.name === siteName);
        if (site) payload.append('siteIds', String(site.id));
    });

    // Sous-catégorie
    if (formData.otherSubCategory) {
        payload.append('otherSubCategory', formData.otherSubCategory);
    } else {
        payload.append('subCategoryId', String(formData.subCategory));
    }

    // Process
    if (formData.processDomain)
        payload.append('processDomainId', String(formData.processDomain));

    if (formData.subProcessId)
        payload.append('subProcessId', String(formData.subProcessId));

    // Assignés
    formData.assignedUsers.forEach(u => {
        const user = users.find(us => us.username === u || us.fullName === u);
        if (user) payload.append('assignedUserIds', String(user.id));
    });

    // 🔥 FICHIERS
    formData.attachments.forEach(file => {
        payload.append('attachments', file);
    });

    setLoading(true);
    try {
        if (isEditMode) {
        await api.updateIncident(id!, payload);
        } else {
        await api.createIncident(payload);
        }
        navigate('/incidents');
    } finally {
        setLoading(false);
    }
    };

    const availableSubCategories = formData.category ? subCategories[formData.category] || [] : [];
    const availableSubProcesses = formData.processDomain ? subProcess[formData.processDomain] || [] : [];

    const availableUsers = useMemo(() => {
        if (formData.responsibleServices.length === 0) return [];

        return users.map(user => user.username).filter(Boolean);
    }, [users, formData.responsibleServices]);


    return (
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 transition-colors duration-200">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(isEditMode ? `/incidents/${id}` : '/incidents')} className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{isEditMode ? 'Modifier l\'incident' : 'Nouvel Incident'}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(isEditMode ? `/incidents/${id}` : '/incidents')}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-500 rounded-md shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Enregistrement...' : <><Save className="h-4 w-4" /> {isEditMode ? 'Modifier' : 'Enregistrer'}</>}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-5xl mx-auto w-full space-y-8">

                {/* Section 1: Localisation / Portée */}
                <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                        1. Localisation / Portée
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site concerné <span className="text-red-500">*</span></label>
                            <MultiSelect
                                required
                                options={sites.map(s => s.name)}
                                selected={formData.site}
                                onChange={(vals) => handleMultiSelectChange('site', vals)}
                                placeholder="Choisir un ou plusieurs sites..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Périmètre de l'incident / Autre(s) site(s)</label>
                            <input
                                type="text"
                                name="scope"
                                autoComplete="off"
                                value={formData.scope}
                                onChange={handleChange}
                                placeholder="Ex: Salle 304, Application Web, Ligne de production A"
                                className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Qualification Métier */}
                <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                        2. Qualification Métier
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catégorie principale <span className="text-red-500">*</span></label>
                                <div>
                                    <SearchSelect
                                        required
                                        options={categories.map(c => c.name)}
                                        value={
                                            categories.find(c => String(c.id) === formData.category)?.name || ''
                                        }
                                        onChange={(selectedName) => {
                                            const selectedCategory = categories.find(c => c.name === selectedName);

                                            setFormData(prev => ({
                                                ...prev,
                                                category: selectedCategory ? String(selectedCategory.id) : '',
                                                subCategory: ''
                                            }));
                                        }}
                                        placeholder="Rechercher une catégorie..."
                                    />

                                </div>

                            </div>
                            <div>
                                <SearchSelect
                                    label="Sous-catégorie"
                                    options={availableSubCategories.map(sc => sc.name)}
                                    value={
                                        availableSubCategories.find(sc => sc.id === formData.subCategory)?.name || ''
                                    }
                                    onChange={(selectedName) => {
                                        const selectedSubCategory =
                                            availableSubCategories.find(sc => sc.name === selectedName);

                                        setFormData(prev => ({
                                            ...prev,
                                            subCategory: selectedSubCategory ? selectedSubCategory.id : ''
                                        }));
                                    }}
                                    placeholder={
                                        formData.category
                                            ? 'Rechercher une sous-catégorie...'
                                            : 'Sélectionner une catégorie d’abord'
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    {availableSubCategories.find(sc => sc.id === formData.subCategory)?.name === 'Autre' && (
                        <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Précision (Sous-catégorie non listée)
                            </label>
                            <input
                                type="text"
                                name="otherSubCategory"
                                autoComplete="off"
                                value={formData.otherSubCategory}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                            />
                        </div>
                    )}


                    <div>
                        <div>
                            <SearchSelect
                                label="Processus"
                                options={processDomains.map(p => p.name)}
                                value={
                                    processDomains.find(p => String(p.id) === formData.processDomain)?.name || ''
                                }
                                onChange={(selectedName) => {
                                    const selectedProcess = processDomains.find(p => p.name === selectedName);

                                    setFormData(prev => ({
                                        ...prev,
                                        processDomain: selectedProcess ? String(selectedProcess.id) : '',
                                        subProcessId: ''
                                    }));
                                }}
                            />

                        </div>
                        <div>
                            <SearchSelect
                                label="Sous-processus"
                                options={availableSubProcesses.map(sp => sp.name)}
                                value={
                                    availableSubProcesses.find(
                                        sp => String(sp.id) === String(formData.subProcessId)
                                    )?.name || ''
                                }
                                onChange={(selectedName) => {
                                    const selectedSubProcess = availableSubProcesses.find(
                                        sp => sp.name === selectedName
                                    );

                                    setFormData(prev => ({
                                        ...prev,
                                        subProcessId: selectedSubProcess ? String(selectedSubProcess.id) : ''
                                    }));
                                }}
                            />

                        </div>
                    </div>
                </section>

                {/* Section 3: Description */}
                <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                        3. Description
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description détaillée <span className="text-red-500">*</span></label>
                            <textarea
                                name="description"
                                autoComplete="off"
                                required
                                rows={5}
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                                placeholder="Décrivez l'incident, les symptômes observés, les messages d'erreur..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pièces jointes</label>
                            <label
                                htmlFor="file-upload-incident"
                                className="flex justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer w-full"
                            >
                                <div className="text-center">
                                    <Paperclip className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                                    <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400 justify-center">
                                        <span className="font-semibold text-brand-600 hover:text-brand-500">
                                            Upload a file
                                        </span>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-500">PNG, JPG, PDF up to 10MB</p>
                                </div>
                                <input
                                    id="file-upload-incident"
                                    name="attachments"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    onChange={handleFileChange}
                                />
                            </label>
                            {formData.attachments.length > 0 && (
                                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    {formData.attachments.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between py-2 pl-3 pr-4 text-sm">
                                            <span className="truncate font-medium text-slate-900 dark:text-white">{file.name}</span>
                                            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section 4: Impact & Urgence */}
                <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                        4. Impact & Urgence
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Criticité Métier</label>
                            <select
                                name="criticality"
                                value={formData.criticality}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                            >
                                {CRITICALITY.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Urgence</label>
                            <select
                                name="urgency"
                                value={formData.urgency}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                            >
                                {URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section 5 & 6: Assignation & Délais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 5: Assignation */}
                    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                            5. Assignation
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service(s) responsable(s) du traitement <span className="text-red-500">*</span></label>
                                <MultiSelect
                                    required
                                    options={sites.map(s => s.name).filter(Boolean)}
                                    selected={formData.responsibleServices}
                                    onChange={(vals) => handleMultiSelectChange('responsibleServices', vals)}
                                    placeholder="Choisir les services..."
                                />
                            </div>

                            <div>
                                <SearchSelect
                                    label="Employé assigné"
                                    options={availableUsers}
                                    value={formData.assignedUsers[0] || ''}
                                    onChange={(selectedUser) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            assignedUsers: selectedUser ? [selectedUser] : []
                                        }));
                                    }}
                                    placeholder={
                                        formData.responsibleServices.length > 0
                                            ? "Rechercher un utilisateur..."
                                            : "Sélectionner un service d'abord"
                                    }
                                />
                            </div>

                        </div>
                    </section>

                    {/* Section 6: Délais */}
                    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                            6. Délais
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date d'échéance souhaitée <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="dueDate"
                                required
                                value={formData.dueDate}
                                onChange={handleChange}
                                className="block w-full rounded-md border-0 py-2 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-brand-600 dark:bg-slate-800 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </section>
                </div>

            </div>
        </form>
    );
};