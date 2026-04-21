import React, { useState, useMemo, useRef, useEffect } from 'react';

interface SearchSelectProps {
  label?: string;
  options: string[];
  value: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const SearchSelect: React.FC<SearchSelectProps> = ({
  label,
  options,
  value,
  onChange,
  required,
  disabled = false,
  placeholder = 'Rechercher...'
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

//   const filteredOptions = useMemo(() => {
//     return options.filter(o =>
//       o.toLowerCase().includes(query.toLowerCase())
//     );
//   }, [options, query]);
const filteredOptions = useMemo(() => {
  return options
    .filter((o): o is string => typeof o === 'string' && o.trim() !== '')
    .filter(o => o.toLowerCase().includes(query.toLowerCase()));
}, [options, query]);

  const selectValue = (val: string) => {
    onChange(val);
    setQuery('');
    setOpen(false);
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

      <input
        type="text"
        value={open ? query : value}
        onFocus={() => !disabled && setOpen(true)}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="
          w-full rounded-md border px-3 py-2 text-sm
          bg-white text-slate-900 border-slate-300
          dark:bg-slate-800 dark:text-white dark:border-slate-700
          focus:outline-none focus:ring-2 focus:ring-brand-600
          disabled:cursor-not-allowed disabled:opacity-60
        "
      />

      {open && !disabled && filteredOptions.length > 0 && (
        <ul
          className="
            absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow
            bg-white border-slate-300
            dark:bg-slate-800 dark:border-slate-700
          "
        >
          {filteredOptions.map(option => (
            <li
              key={option}
              onClick={() => selectValue(option)}
              className="
                cursor-pointer px-3 py-2 text-sm
                text-slate-900 hover:bg-slate-100
                dark:text-slate-200 dark:hover:bg-slate-700
              "
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
