"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#features", label: "Funciones" },
  { href: "#how",      label: "¿Cómo funciona?" },
  { href: "/pricing",  label: "Precios" },
  { href: "/explorar", label: "Explorar negocios", desktopOnly: true },
];

export default function NavbarClient() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="w-7 h-7 rounded-lg" aria-hidden="true" />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #C060D4, #7B4FE8, #4B5CF0)" }}>
            Reunio
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-foreground transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Empezar gratis</Button>
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/register">
            <Button size="sm" className="text-xs px-3">Empezar gratis</Button>
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Menú"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur px-4 py-4 space-y-1 shadow-lg">
          {NAV_LINKS.filter(l => !l.desktopOnly).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t mt-3">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full mb-2">Iniciar sesión</Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button className="w-full">Empezar gratis</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
