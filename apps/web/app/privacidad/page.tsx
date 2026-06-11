import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de privacidad — Reunio",
  description: "Cómo recopilamos, usamos y protegemos tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de privacidad</h1>
        <p className="text-muted-foreground text-sm mb-10">Última actualización: junio de 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Responsable del tratamiento</h2>
            <p>Reunio es el responsable del tratamiento de los datos personales recopilados a través de esta plataforma. Para consultas de privacidad, contactanos en <a href="mailto:privacidad@reunio.app" className="underline hover:text-foreground">privacidad@reunio.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Datos que recopilamos</h2>
            <p className="mb-3">Recopilamos los siguientes tipos de datos:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Datos de registro:</strong> nombre, email y contraseña al crear una cuenta.</li>
              <li><strong className="text-foreground">Datos del negocio:</strong> nombre del negocio, dirección, teléfono y datos de perfil.</li>
              <li><strong className="text-foreground">Datos de reservas:</strong> nombre y teléfono de clientes, fecha y hora de los turnos.</li>
              <li><strong className="text-foreground">Datos de uso:</strong> páginas visitadas, acciones realizadas y registros de errores (mediante Sentry y PostHog).</li>
              <li><strong className="text-foreground">Datos de pago:</strong> solo almacenamos referencias y IDs de transacción. Nunca guardamos datos de tarjetas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Cómo usamos tus datos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Proveer y mejorar el Servicio</li>
              <li>Enviar confirmaciones y recordatorios de turnos</li>
              <li>Procesar pagos y suscripciones</li>
              <li>Comunicaciones sobre el Servicio (cambios, novedades, soporte)</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Compartir datos con terceros</h2>
            <p className="mb-3">Compartimos datos únicamente con los siguientes proveedores de servicio que actúan bajo acuerdos de procesamiento de datos:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Supabase</strong> — base de datos y autenticación</li>
              <li><strong className="text-foreground">Vercel</strong> — infraestructura de hosting</li>
              <li><strong className="text-foreground">Stripe</strong> — procesamiento de suscripciones SaaS</li>
              <li><strong className="text-foreground">Mercado Pago</strong> — señas y pagos de turnos</li>
              <li><strong className="text-foreground">360dialog / Meta</strong> — envío de mensajes por WhatsApp</li>
              <li><strong className="text-foreground">Resend</strong> — envío de emails transaccionales</li>
            </ul>
            <p className="mt-3">No vendemos ni alquilamos datos personales a terceros bajo ninguna circunstancia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Retención de datos</h2>
            <p>Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, borramos los datos personales en un plazo de 30 días, salvo que la ley nos exija conservarlos por más tiempo.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Tus derechos</h2>
            <p className="mb-2">Tenés derecho a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acceder a los datos que tenemos sobre vos</li>
              <li>Rectificar datos incorrectos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Oponerte al tratamiento de tus datos</li>
              <li>Exportar tus datos en formato portable</li>
            </ul>
            <p className="mt-3">Para ejercer estos derechos, escribinos a <a href="mailto:privacidad@reunio.app" className="underline hover:text-foreground">privacidad@reunio.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies y seguimiento</h2>
            <p>Usamos cookies esenciales para el funcionamiento del Servicio. También usamos PostHog para analíticas de uso anónimas. Podés desactivar las cookies no esenciales desde la configuración de tu navegador.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Seguridad</h2>
            <p>Aplicamos medidas técnicas y organizativas estándar de la industria para proteger tus datos, incluyendo cifrado TLS en tránsito, cifrado en reposo y controles de acceso por roles (RLS en base de datos).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Cambios a esta política</h2>
            <p>Podemos actualizar esta política ocasionalmente. Te notificaremos por email ante cambios significativos. La fecha de "última actualización" al tope del documento refleja la versión vigente.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad: <a href="mailto:privacidad@reunio.app" className="underline hover:text-foreground">privacidad@reunio.app</a> o nuestro <Link href="/contacto" className="underline hover:text-foreground">formulario de contacto</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
