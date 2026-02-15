import React, { useState, useMemo, useRef, useEffect } from 'react';

type Primitive = string | number;

type OptionObject = {
  label: string;
  value: Primitive;
};

type Option = string | OptionObject;

interface MultiSelectProps {
  label?: string;
  options: Option[];
  selected: Primitive[];
  required?: boolean;
  placeholder?: string;
  onChange: (values: Primitive[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  required,
  placeholder = 'Rechercher...'
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🔥 Normalisation des options (support string OU object)
  const normalizedOptions: OptionObject[] = useMemo(() => {
    return options.map(opt =>
      typeof opt === 'string'
        ? { label: opt, value: opt }
        : opt
    );
  }, [options]);

  const filteredOptions = useMemo(() => {
    return normalizedOptions
      .filter(o => !selected.includes(o.value))
      .filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase())
      );
  }, [normalizedOptions, selected, query]);

  const addValue = (value: Primitive) => {
    onChange([...selected, value]);
    setQuery('');
    setOpen(true);
  };

  const removeValue = (value: Primitive) => {
    onChange(selected.filter(v => v !== value));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          {label} {required && '*'}
        </label>
      )}

      <div className="flex flex-wrap gap-1 mb-1">
        {selected.map(val => {
          const option = normalizedOptions.find(o => o.value === val);
          return (
            <span
              key={String(val)}
              className="
                px-2 py-1 text-sm rounded flex items-center gap-1
                bg-slate-200 text-slate-900
                dark:bg-slate-700 dark:text-white
              "
            >
              {option?.label ?? val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="text-xs hover:opacity-70"
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>

      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-md border px-3 py-2 text-sm
          bg-white text-slate-900 border-slate-300
          dark:bg-slate-800 dark:text-white dark:border-slate-700
          focus:outline-none focus:ring-2 focus:ring-brand-600
        "
      />

      {open && filteredOptions.length > 0 && (
        <ul
          className="
            absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow
            bg-white border-slate-300
            dark:bg-slate-800 dark:border-slate-700
          "
        >
          {filteredOptions.map(option => (
            <li
              key={String(option.value)}
              onClick={() => addValue(option.value)}
              className="
                cursor-pointer px-3 py-2 text-sm
                text-slate-900 hover:bg-slate-100
                dark:text-slate-200 dark:hover:bg-slate-700
              "
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
