"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { PlanName } from "@/lib/plans";
import SidebarNav from "./SidebarNav";
import LogoutButton from "./LogoutButton";

interface Props {
  currentPlan: PlanName;
  email: string;
  organizationSlug: string;
}

export default function MobileSidebar({ currentPlan, email, organizationSlug }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-md hover:bg-accent transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-background border-r flex flex-col
        transform transition-transform duration-200 ease-in-out md:hidden
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">Reunio</span>
            <span className="text-xs text-muted-foreground font-medium">Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SidebarNav currentPlan={currentPlan} />
        </div>

        <div className="p-4 border-t space-y-2 shrink-0">
          <p className="text-xs text-muted-foreground truncate px-1">{email}</p>
          <div className="flex items-center justify-between">
            <Link
              href={`/${organizationSlug}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
            >
              Ver página ↗
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
    </>
  );
}
