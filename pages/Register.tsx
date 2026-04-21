import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { api } from "../services/api";

type FormState = {
  matricule: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  matricule: "",
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const matriculeRegex = /^[A-Z]{2}\d+$/;

function normalizeMatricule(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!matriculeRegex.test(form.matricule)) {
    errors.matricule =
      "Le matricule doit contenir 2 lettres majuscules suivies de chiffres, sans espace ni caractère spécial.";
  }

  if (!form.username.trim() || form.username.trim().length < 3) {
    errors.username = "Le username est obligatoire et doit contenir au moins 3 caractères.";
  }

  if (!form.firstName.trim()) {
    errors.firstName = "Le prénom est obligatoire.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Le nom est obligatoire.";
  }

  if (!form.email.trim()) {
    errors.email = "L'email est obligatoire.";
  } else {
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@(?:[^\s@]+\.)*groupesorepco\.com$/.test(normalizedEmail)) {
      errors.email = "L'email doit appartenir au domaine groupesorepco.com.";
    }
  }

  if (!form.password || form.password.length < 6) {
    errors.password = "Le mot de passe doit contenir au moins 6 caractères.";
  }

  if (!form.confirmPassword || form.confirmPassword.length < 6) {
    errors.confirmPassword = "Veuillez confirmer le mot de passe (6 caractères minimum).";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas.";
  }

  return errors;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    matricule: false,
    username: false,
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateForm(form), [form]);
  const canSubmit = useMemo(
    () => !isSubmitting && Object.keys(errors).length === 0,
    [errors, isSubmitting]
  );

  const handleChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const value = field === "matricule" ? normalizeMatricule(rawValue) : rawValue;

      setForm((prev) => ({ ...prev, [field]: value }));
      setSubmitError(null);
      setSubmitSuccess(null);
    };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setTouched({
      matricule: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);


    try {
      // On envoie confirmPassword dans le payload, mais on force le typage pour TS
      const payload = {
        matricule: form.matricule,
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      };
      await api.registerAccount(payload as any);

      setSubmitSuccess("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      setForm(initialState);

      window.setTimeout(() => {
        navigate("/login?registered=1", { replace: true });
      }, 1200);
    } catch (error) {
      let message = error instanceof Error ? error.message : "Impossible de créer le compte.";
      // Si la réponse contient matricule déjà existant ou un code d'erreur connu, on affiche un message plus clair
      if (typeof message === 'string') {
        if (/matricule.*exi(s|st)e/i.test(message) || /duplicate.*matricule/i.test(message)) {
          message = "Ce matricule existe déjà. Veuillez en saisir un autre ou contacter l'administrateur.";
        } else if (/username.*exi(s|st)e/i.test(message) || /duplicate.*username/i.test(message)) {
          message = "Ce nom d'utilisateur existe déjà. Veuillez en choisir un autre.";
        } else if (/email.*exi(s|st)e/i.test(message) || /duplicate.*email/i.test(message)) {
          message = "Cet email est déjà utilisé. Veuillez en saisir un autre.";
        } else if (/INTERNAL_SERVER_ERROR|unexpected error/i.test(message)) {
          message = "Une erreur technique est survenue. Veuillez réessayer ou contacter l'administrateur.";
        }
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClassName =
    "mt-2 block w-full rounded-xl border-0 bg-white px-4 py-3 text-slate-900 ring-1 ring-inset ring-slate-300 transition focus:ring-2 focus:ring-brand-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700";

  const renderError = (field: keyof FormState) => {
    if (!touched[field] || !errors[field]) return null;

    return <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{errors[field]}</p>;
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-white/60 bg-slate-900 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
              <BadgeCheck className="h-4 w-4" />
              Création de compte
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight">
              Activez votre accès à Incident.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              Renseignez vos informations obligatoires pour créer votre compte. Le matricule
              est strictement contrôlé selon votre format métier.
            </p>

            <div className="mt-10 space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="font-medium">Format du matricule</p>
                <p className="mt-1 text-slate-300">
                  Deux lettres majuscules suivies uniquement de chiffres.
                </p>
                <p className="mt-1 font-mono text-xs text-emerald-300">
                  Exemples : DL1488, YT47854, MT47587
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="font-medium">Champs requis</p>
                <p className="mt-1 text-slate-300">
                  Matricule, Nom d'utilisateur, prénom, nom, email et mot de passe.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Nouveau compte
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Les informations ci-dessous sont toutes obligatoires.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Connexion
              </Link>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Matricule
                </label>
                <div className="relative">
                  <Fingerprint className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.matricule}
                    onChange={handleChange("matricule")}
                    onBlur={handleBlur("matricule")}
                    placeholder="DL1488"
                    className={`${fieldClassName} pl-12`}
                    maxLength={32}
                  />
                </div>
                {renderError("matricule")}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={handleChange("username")}
                    onBlur={handleBlur("username")}
                    placeholder="username"
                    className={`${fieldClassName} pl-12`}
                  />
                </div>
                {renderError("username")}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={handleChange("firstName")}
                    onBlur={handleBlur("firstName")}
                    placeholder="Prénom"
                    className={fieldClassName}
                  />
                  {renderError("firstName")}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={handleChange("lastName")}
                    onBlur={handleBlur("lastName")}
                    placeholder="Nom"
                    className={fieldClassName}
                  />
                  {renderError("lastName")}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    onBlur={handleBlur("email")}
                    placeholder="nom@entreprise.com"
                    className={`${fieldClassName} pl-12`}
                  />
                </div>
                {renderError("email")}
              </div>


              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    onBlur={handleBlur("password")}
                    placeholder="Minimum 6 caractères"
                    className={`${fieldClassName} pl-12`}
                  />
                </div>
                {renderError("password")}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    placeholder="Retapez le mot de passe"
                    className={`${fieldClassName} pl-12`}
                  />
                </div>
                {renderError("confirmPassword")}
              </div>

              {submitError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {submitSuccess}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-600 dark:hover:bg-brand-500"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Création en cours..." : "Créer le compte"}
                </button>

                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
