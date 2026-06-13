"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 p-4 bg-background/90 backdrop-blur border-t">
      <Link href="/register" className="block">
        <button
          className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: "#7B4FE8" }}
        >
          Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
        </button>
      </Link>
      <p className="text-center text-xs text-muted-foreground mt-2">
        Sin tarjeta · Gratis para siempre en el plan básico
      </p>
    </div>
  );
}
