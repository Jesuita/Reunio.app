"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface City { id: number; name: string; province: string }

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CityAutocomplete({ value, onChange, placeholder = "Ej: Buenos Aires", className }: Props) {
  const [query,   setQuery]   = useState(value);
  const [cities,  setCities]  = useState<City[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setCities([]); setOpen(false); return; }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/cities?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then(({ cities }: { cities: City[] }) => {
        setCities(cities);
        setOpen(cities.length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(city: City) {
    const label = `${city.name}, ${city.province}`;
    setQuery(label);
    onChange(label);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => { if (cities.length > 0) setOpen(true); }}
        className={`w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${className ?? ""}`}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {open && cities.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {cities.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(city); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{city.name}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">{city.province}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
