import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ 
  options, 
  selected, 
  onChange, 
  placeholder = "Sélectionner...",
  label,
  required
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[38px] cursor-pointer block w-full rounded-md border py-1.5 pl-3 pr-10 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 dark:bg-slate-800 transition-all ${isOpen ? 'ring-2 ring-brand-600 border-brand-600' : 'border-0 ring-slate-300 dark:ring-slate-700'}`}
      >
        <div className="flex flex-wrap gap-1.5">
          {selected.length === 0 && (
            <span className="text-slate-400 dark:text-slate-500 py-0.5">{placeholder}</span>
          )}
          {selected.map(item => (
            <span key={item} className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
              {item}
              <span 
                role="button" 
                onClick={(e) => removeOption(item, e)}
                className="rounded-sm hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 top-0 bottom-0 mt-auto mb-auto h-full">
            {label ? <div className="h-6"></div> : null} {/* Spacer if label exists to align icon correctly if needed, simpler to just absolute right */}
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-200 dark:border-slate-700">
          {options.length === 0 ? (
             <div className="relative cursor-default select-none py-2 px-3 text-slate-500 dark:text-slate-400 italic">
               Aucune option disponible
             </div>
          ) : (
             options.map((option) => (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-slate-100 dark:hover:bg-slate-700/50 ${selected.includes(option) ? 'bg-slate-50 dark:bg-slate-700/30' : 'text-slate-900 dark:text-slate-200'}`}
                >
                  <span className={`block truncate ${selected.includes(option) ? 'font-semibold text-brand-600 dark:text-brand-400' : 'font-normal'}`}>
                    {option}
                  </span>
                  {selected.includes(option) && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-brand-600 dark:text-brand-400">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};