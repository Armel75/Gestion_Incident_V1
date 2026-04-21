import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Récupère le token dans l'URL
  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage("Lien invalide ou expiré.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      try {
        await resetPassword(token, password);
        setMessage("Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err: any) {
        setMessage(err.message || "Erreur lors de la réinitialisation.");
      }
    } catch (err) {
      setMessage("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 py-10">
      <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-slate-900 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-6">Réinitialiser le mot de passe</h1>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          className="block w-full rounded-xl border-0 bg-slate-800 px-4 py-3 mb-4 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-brand-600"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          className="block w-full rounded-xl border-0 bg-slate-800 px-4 py-3 mb-4 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-brand-600"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 mb-2"
          disabled={loading}
        >
          {loading ? "Réinitialisation..." : "Réinitialiser"}
        </button>
        {message && <div className="text-center text-sm mt-2 text-red-400">{message}</div>}
      </form>
    </div>
  );
};

export default ResetPassword;
