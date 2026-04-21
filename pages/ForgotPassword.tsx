import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      await forgotPassword(email);
      setMessage("Si cet email existe, un lien a été envoyé.");
    } catch (err: any) {
      setMessage(err.message || "Erreur lors de la demande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 flex items-center justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[28px] border border-white/10 bg-slate-900 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
            <KeyRound className="h-4 w-4" />
            Mot de passe oublié
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight">
            Mot de passe oublié
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            Cette page est prête et accessible depuis la connexion.
          </p>

          <div className="mt-8 max-w-xl">
            <label className="text-sm font-medium text-slate-200">
              Email de récupération
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nom@groupesorepco.com"
                className="block w-full rounded-xl border-0 bg-slate-800 px-4 py-3 pl-12 text-white ring-1 ring-inset ring-slate-700 transition focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Envoi..." : "Soumettre la récupération"}
            </button>
          {message && (
            <div className="mt-4 text-center text-sm text-red-400">{message}</div>
          )}

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
