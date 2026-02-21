import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User as UserIcon, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../src/types/auth/AuthContext";

// Types côté UI (alignés avec /auth/me)
type MeUser = {
  id: number | string;
  username: string;
  fullName: string;
  role: string;
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
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="bg-white dark:bg-slate-950 px-2 text-slate-500 dark:text-slate-400">{children}</span>
    </div>
  </div>
);

export const Login: React.FC = () => {
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
      const moved = TOKEN_KEYS.some((k) => {
        const v = localStorage.getItem(k);
        if (!v) return false;
        if (rememberMe) return true; // garder localStorage
        // déplacer vers sessionStorage
        sessionStorage.setItem(k, v);
        localStorage.removeItem(k);
        return true;
      });
      // Si api.login utilise une autre stratégie, "moved" peut être false sans casser le login.

      // 2) /me
      const me = (await api.me()) as MeUser;

      // 3) Hydrate le contexte
      setUser(me);

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
      {/* Split-screen premium */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Panel visuel */}
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,white,transparent_50%)]" />
          <div className="relative h-full p-12 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <Lock className="h-5 w-5 text-white/90" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <p className="text-white text-3xl lg:text-5xl font-bold tracking-tight whitespace-nowrap">
                  Tracking Incident V2
                </p>
                <p className="text-white/70 text-base lg:text-lg font-medium tracking-wide">
                  Espace entreprise • Accès sécurisé
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Un accès sécurisé, conçu pour la performance.
              </h1>
              <p className="mt-4 text-white/70 leading-relaxed">
                Connecte-toi à ton espace professionnel, pilote les incidents en temps réel et collabore avec efficacité — dans un environnement fiable, structuré et pensé pour les exigences métier.
              </p>

              <Divider>Bonnes pratiques</Divider>

              <ul className="space-y-3 text-sm text-white/75">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-white/80" aria-hidden="true" />
                  <span>Validation en temps réel et erreurs compréhensibles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-white/80" aria-hidden="true" />
                  <span>Accès clavier et focus visibles pour l’accessibilité.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-white/80" aria-hidden="true" />
                  <span>Protection contre les doubles soumissions.</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-white/50">© {new Date().getFullYear()} SOREPCO</p>
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
