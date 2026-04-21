import React, { useEffect, useState } from "react";
import { api } from "../../../services/api";

type Site = { id: number; name: string };

type Props = {
  value: any; // number | "" | undefined
  onChange: (v: any) => void;
  placeholder?: string;
};

function toArray<T>(x: any): T[] {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.data)) return x.data;
  return [];
}

export const SiteSelectInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Choisir un site…",
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const resp = await (api as any).getSites(1, 1000); // ✅ tu dois avoir un endpoint sites
        const list = toArray<Site>(resp);
        if (!cancelled) setSites(list);
      } catch (e) {
        console.error(e);
        if (!cancelled) setSites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-500 italic px-2">Chargement…</div>;
  }

  const selected = value === "" || value === undefined || value === null ? "" : String(value);

  return (
    <select
      className="h-8 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm"
      value={selected}
      onChange={(e) => {
        if (e.target.value === "") return onChange(undefined);
        onChange(Number(e.target.value));
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>

      {sites.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
};