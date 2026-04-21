import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldAlert,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../src/types/auth/AuthContext";
import type { User } from "../types";

// Types côté UI (alignés avec /auth/me)
type MeUser = {
  id: number | string;
  username: string;
  fullName?: string;
  role?: string;
  roles?: Array<string | { id?: number; name: string }>;
  isActive?: boolean;
  siteId?: number | null;
  site?: { id: number; name: string } | null;
  createdAt?: string;
  permissions?: string[];
};

type Status = "idle" | "loading" | "success" | "error";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function sanitizeInput(v: string) {
  // Sanitize minimal côté UI (trim + collapse espaces)
  return v.replace(/\s+/g, " ").trim();
}

function getFriendlyErrorMessage(err: unknown): string {
  // Objectif: message utile, non technique. Pas de logs sensibles.
  // On essaie de détecter quelques formes courantes: fetch/axios/custom.
  const anyErr = err as any;

  // Axios-like
  const status = anyErr?.response?.status ?? anyErr?.status;
  if (status === 401) return "Identifiants incorrects. Vérifie ton nom d’utilisateur et ton mot de passe.";
  if (status === 429) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (typeof status === "number" && status >= 500) return "Le serveur rencontre un problème. Réessaie plus tard.";

  // Fetch-like network error
  const msg = String(anyErr?.message ?? "");
  if (/network|failed to fetch|fetch/i.test(msg)) {
    return "Impossible de joindre le serveur. Vérifie ta connexion réseau puis réessaie.";
  }

  return "Connexion impossible. Vérifie tes informations et réessaie.";
}

function validateUsername(v: string) {
  const value = sanitizeInput(v);
  if (!value) return "Le nom d’utilisateur est requis.";
  if (value.length < 3) return "Minimum 3 caractères.";
  if (value.length > 80) return "Maximum 80 caractères.";
  return null;
}

function validatePassword(v: string) {
  // On reste volontairement simple (côté login, pas signup)
  if (!v) return "Le mot de passe est requis.";
  if (v.length < 6) return "Minimum 6 caractères.";
  if (v.length > 200) return "Mot de passe trop long.";
  return null;
}

const FieldHint: React.FC<{ id: string; tone?: "muted" | "danger"; children: React.ReactNode }> = ({
  id,
  tone = "muted",
  children,
}) => (
  <p
    id={id}
    className={cn(
      "mt-2 text-xs leading-5",
      tone === "muted" && "text-slate-500 dark:text-slate-400",
      tone === "danger" && "text-rose-600 dark:text-rose-400"
    )}
  >
    {children}
  </p>
);

const Divider: React.FC<{ children: string }> = ({ children }) => (
  <div className="relative my-6 w-full max-w-md mx-auto">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-white/15" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="px-3 text-white/60 backdrop-blur-sm bg-white/5 rounded-full ring-1 ring-white/10">
        {children}
      </span>
    </div>
  </div>
);

export const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const formId = useId();
  const usernameId = `${formId}-username`;
  const passwordId = `${formId}-password`;

  const usernameHelpId = `${usernameId}-help`;
  const passwordHelpId = `${passwordId}-help`;
  const formErrorId = `${formId}-formerror`;

  const [usernameRaw, setUsernameRaw] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  // Affiche le message si ?registered=1 dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === '1') {
      setRegisterSuccess(true);
      // Nettoie l'URL après affichage
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Validation temps réel (mais on n'affiche l'erreur qu'après interaction)
  const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false,
  });

  const username = useMemo(() => sanitizeInput(usernameRaw), [usernameRaw]);
  const usernameError = useMemo(() => validateUsername(username), [username]);
  const passwordError = useMemo(() => validatePassword(password), [password]);

  const canSubmit = useMemo(() => {
    if (status === "loading") return false;
    return !usernameError && !passwordError;
  }, [status, usernameError, passwordError]);

  const usernameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // Logo SOREPCO (SVG base64) - conservé
  const logoSrc =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAyMDAgODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDA5ZTQ5Ij5TT1JFUENPPC90ZXh0Pjwvc3ZnPg==";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ username: true, password: true });

    // Anti double-submit + validation
    if (!canSubmit) return;

    setStatus("loading");
    setFormError(null);

    try {
      // 1) Login -> api.login stocke déjà token(s) en localStorage dans ton implémentation
      //    Si "rememberMe" est false: on force storage "session" (meilleure UX).
      //    On ne touche pas à api.login ici (contrainte "1 fichier"), on gère juste le stockage après coup.
      await api.login(username, password);

      // Ajustement "Remember me" (optionnel mais utile)
      // Hypothèse: api.login stocke un token en localStorage sous une clé connue.
      // Si ta clé diffère, adapte TOKEN_KEYS ci-dessous.
      const TOKEN_KEYS = ["token", "accessToken", "authToken"];
      TOKEN_KEYS.some((k) => {
        const v = localStorage.getItem(k);
        if (!v) return false;
        if (rememberMe) return true; // garder localStorage
        // déplacer vers sessionStorage
        sessionStorage.setItem(k, v);
        localStorage.removeItem(k);
        return true;
      });

      // 2) /me
      const me = (await api.me()) as MeUser;

      const normalizedRoles =
        Array.isArray(me.roles) && me.roles.length > 0
          ? me.roles.map((role, index) =>
              typeof role === "string"
                ? { id: index, name: role }
                : { id: role.id ?? index, name: role.name }
            )
          : me.role
            ? [{ id: 0, name: me.role }]
            : [];

      const normalizedUser: User = {
        id: Number(me.id),
        username: me.username,
        isActive: me.isActive ?? true,
        permissions: me.permissions,
        roles: normalizedRoles,
        siteId: me.siteId ?? null,
        site: me.site ?? null,
        createdAt: me.createdAt ?? new Date().toISOString(),
      };

      // 3) Hydrate le contexte
      setUser(normalizedUser);

      setStatus("success");

      // 4) Navigate après micro feedback (court, sans timer visible)
      // (évite un flash d'état)
      navigate("/", { replace: true });
    } catch (err) {
      setStatus("error");
      setFormError(getFriendlyErrorMessage(err));
      // Aucune info sensible en console.
    }
  }

  const showUsernameError = touched.username && !!usernameError;
  const showPasswordError = touched.password && !!passwordError;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      {registerSuccess && (
        <div className="max-w-md mx-auto mt-6 mb-2 px-4 py-3 rounded bg-green-100 text-green-800 border border-green-300 text-center font-medium">
          Votre compte a bien été créé, vous pouvez vous connecter.
        </div>
      )}
      {/* Split-screen premium */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Panel visuel */}
        <div className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.10),transparent_30%)]" />
          <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:44px_44px]" />

          <div className="relative h-full px-8 py-10 xl:px-12 xl:py-12 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-5xl mx-auto text-center">
                <div className="flex flex-col items-center justify-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-[28px] bg-emerald-400/20 blur-xl" />
                    <div className="relative h-16 w-16 rounded-[22px] bg-white/10 ring-1 ring-white/15 flex items-center justify-center backdrop-blur-xl shadow-[0_12px_50px_rgba(0,0,0,0.35)]">
                      <Lock className="h-8 w-8 text-white/95" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                      <Sparkles className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                      <span className="text-xs font-medium tracking-[0.22em] uppercase text-white/75">
                        Plateforme métier sécurisée
                      </span>
                    </div>

                    <p className="text-white text-5xl xl:text-7xl font-extrabold tracking-tight">
                      Tracking Incident V2
                    </p>
                    <p className="text-white/70 text-base xl:text-lg font-medium tracking-wide">
                      Espace entreprise • Accès sécurisé
                    </p>
                  </div>
                </div>

                <div className="mt-10 max-w-3xl mx-auto">
                  <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-white text-center">
                    Un accès sécurisé, conçu pour la performance.
                  </h1>
                  <p className="mt-5 text-base xl:text-lg text-white/70 leading-relaxed text-center max-w-3xl mx-auto">
                    Connecte-toi à ton espace professionnel, pilote les incidents en temps réel et collabore avec efficacité — dans un environnement fiable, structuré et pensé pour les exigences métier.
                  </p>

                  <Divider>Fonctionnalités principales</Divider>

                  <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-5 max-w-5xl mx-auto">
                    <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.07] backdrop-blur-xl px-6 py-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.09] hover:shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%)] opacity-90" />
                      <div className="relative">
                        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/10 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                          <ShieldAlert className="h-7 w-7 text-emerald-200" aria-hidden="true" />
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-white text-lg xl:text-xl font-semibold tracking-tight">
                            Gestion instantanée
                          </h3>
                          <p className="text-white/80 text-sm xl:text-base leading-7">
                            Suivi et traitement des incidents en temps réel.
                          </p>
                        </div>

                        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/20 via-white/8 to-transparent" />
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.07] backdrop-blur-xl px-6 py-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.09] hover:shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%)] opacity-90" />
                      <div className="relative">
                        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/10 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                          <Activity className="h-7 w-7 text-sky-200" aria-hidden="true" />
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-white text-lg xl:text-xl font-semibold tracking-tight">
                            Vue centralisée
                          </h3>
                          <p className="text-white/80 text-sm xl:text-base leading-7">
                            Monitoring centralisé des demandes et interventions.
                          </p>
                        </div>

                        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/20 via-white/8 to-transparent" />
                      </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.07] backdrop-blur-xl px-6 py-6 text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.09] hover:shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_35%)] opacity-90" />
                      <div className="relative">
                        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/10 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                          <ListChecks className="h-7 w-7 text-violet-200" aria-hidden="true" />
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-white text-lg xl:text-xl font-semibold tracking-tight">
                            Priorisation fluide
                          </h3>
                          <p className="text-white/80 text-sm xl:text-base leading-7">
                            Pilotage efficace des tâches en fonction des priorités.
                          </p>
                        </div>

                        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/20 via-white/8 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10">
              <p className="text-xs text-white/50 text-center tracking-wide">© {new Date().getFullYear()} SOREPCO</p>
            </div>
          </div>
        </div>

        {/* Panel formulaire */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="flex flex-col items-center">
              <img className="h-16 w-auto" src={logoSrc} alt="Sorepco" />
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Connexion
              </h2>
              <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                Connecte-toi pour accéder à l’espace entreprise.
              </p>
              {registerSuccess && (
                <div className="mt-3 mb-2 px-4 py-3 rounded bg-green-100 text-green-800 border border-green-300 text-center text-sm font-medium">
                  Votre compte a bien été créé, vous pouvez vous connecter.
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5">
              <form className="p-6 sm:p-8" onSubmit={handleSubmit} noValidate>
                {/* Erreur globale */}
                <div aria-live="polite" aria-atomic="true">
                  {formError && (
                    <div
                      id={formErrorId}
                      role="alert"
                      className="mb-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                    >
                      <AlertTriangle className="h-5 w-5 flex-none mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium">Connexion refusée</p>
                        <p className="mt-0.5 text-rose-700/90 dark:text-rose-200/90">{formError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor={usernameId}
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Nom d’utilisateur
                  </label>
                  <div className="mt-2 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <UserIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      ref={usernameRef}
                      id={usernameId}
                      name="username"
                      type="text"
                      autoComplete="username"
                      inputMode="email"
                      value={usernameRaw}
                      onChange={(e) => {
                        setUsernameRaw(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                      aria-invalid={showUsernameError ? true : undefined}
                      aria-describedby={cn(usernameHelpId, showUsernameError && usernameHelpId)}
                      className={cn(
                        "block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white",
                        "ring-1 ring-inset bg-white dark:bg-slate-800",
                        showUsernameError
                          ? "ring-rose-300 dark:ring-rose-700 focus:ring-2 focus:ring-rose-500"
                          : "ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "focus:outline-none transition-shadow"
                      )}
                      placeholder="ex: jdoe"
                      required
                    />
                  </div>
                  <FieldHint id={usernameHelpId} tone={showUsernameError ? "danger" : "muted"}>
                    {showUsernameError ? usernameError : "Saisis ton identifiant (au moins 3 caractères)."}
                  </FieldHint>
                </div>

                {/* Password */}
                <div className="mt-5">
                  <label
                    htmlFor={passwordId}
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Mot de passe
                  </label>
                  <div className="mt-2 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>

                    <input
                      id={passwordId}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      aria-invalid={showPasswordError ? true : undefined}
                      aria-describedby={passwordHelpId}
                      className={cn(
                        "block w-full rounded-xl border-0 py-2.5 pl-10 pr-12 text-slate-900 dark:text-white",
                        "ring-1 ring-inset bg-white dark:bg-slate-800",
                        showPasswordError
                          ? "ring-rose-300 dark:ring-rose-700 focus:ring-2 focus:ring-rose-500"
                          : "ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-brand-600",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "focus:outline-none transition-shadow"
                      )}
                      placeholder="••••••••"
                      required
                    />

                    <button
                      type="button"
                      className={cn(
                        "absolute inset-y-0 right-0 flex items-center px-3 rounded-r-xl",
                        "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                        "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                      )}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                    </button>
                  </div>
                  <FieldHint id={passwordHelpId} tone={showPasswordError ? "danger" : "muted"}>
                    {showPasswordError ? passwordError : "Minimum 6 caractères."}
                  </FieldHint>
                </div>

                {/* Options */}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 dark:border-slate-700 dark:bg-slate-800"
                    />
                    Se souvenir de moi
                  </label>

                  {/* Placeholder volontairement neutre (pas de route imposée) */}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Astuce: évite les réseaux publics.
                  </span>
                </div>

                {/* Submit */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                      "shadow-sm transition-colors",
                      !canSubmit
                        ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                        : "bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    )}
                  >
                    {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {status === "success" && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                    {status === "loading" ? "Connexion..." : status === "success" ? "Connecté" : "Se connecter"}
                  </button>

                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    En continuant, tu acceptes les politiques internes de sécurité et d’utilisation.
                  </p>

                  <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Créer un compte
                    </Link>
                    <Link
                      to="/forgot-password"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Mot de passe oublié
                    </Link>
                  </div>
                </div>

                {/* A11y: annoncer l'état global */}
                <div className="sr-only" aria-live="polite">
                  {status === "loading" && "Connexion en cours"}
                  {status === "success" && "Connexion réussie"}
                  {status === "error" && "Connexion échouée"}
                </div>

                {/* Footer compact */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Problème d’accès ? Contacte l’administrateur de ton entreprise.
                  </p>
                </div>
              </form>
            </div>

            {/* Petit footer mobile */}
            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 lg:hidden">
              © {new Date().getFullYear()} SOREPCO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
