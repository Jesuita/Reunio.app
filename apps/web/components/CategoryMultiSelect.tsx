"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Search } from "lucide-react";

interface Option { id: string; name: string; color: string }

interface Props {
  options: Option[];
  value: string;        // comma-separated selected names
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CategoryMultiSelect({ options, value, onChange, placeholder = "Buscá una categoría..." }: Props) {
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref    = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(
    (o) =>
      !selected.includes(o.name) &&
      o.name.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 12);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function add(name: string) {
    const next = [...selected, name];
    onChange(next.join(", "));
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(name: string) {
    const next = selected.filter((s) => s !== name);
    onChange(next.join(", "));
  }

  function colorFor(name: string) {
    return options.find((o) => o.name === name)?.color ?? "#94a3b8";
  }

  return (
    <div ref={ref} className="relative">
      {/* Selected tags + input */}
      <div
        className="min-h-[42px] w-full flex flex-wrap gap-1.5 items-center border border-input rounded-md px-3 py-2 bg-background cursor-text focus-within:ring-2 focus-within:ring-ring"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        {selected.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: colorFor(name) }}
          >
            {name}
            <button
              type="button"
              onMouseDown={(e) => { e.stopPropagation(); remove(name); }}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={selected.length === 0 ? placeholder : "Agregar otra..."}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              {query ? `Sin resultados para "${query}"` : "No hay más categorías"}
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(opt.name); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                  {opt.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
