import SettingsNav from "./SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Administrá la información, horarios y preferencias de tu negocio.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          <SettingsNav />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
