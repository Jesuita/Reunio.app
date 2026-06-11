import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Términos de uso — Reunio",
  description: "Términos y condiciones de uso de Reunio.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Términos de uso</h1>
        <p className="text-muted-foreground text-sm mb-10">Última actualización: junio de 2026</p>

        <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder o utilizar Reunio (en adelante, "el Servicio"), aceptás estos Términos de Uso en su totalidad. Si no estás de acuerdo con alguno de estos términos, no utilices el Servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Descripción del servicio</h2>
            <p>Reunio es una plataforma SaaS de agendamiento de turnos online dirigida a negocios de servicios en Argentina y Latinoamérica. Permite a los negocios ("Negocios") crear páginas de reservas y gestionar su agenda, y a los usuarios finales ("Clientes") reservar turnos de forma online.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Registro y cuentas</h2>
            <p>Para acceder a las funciones del Servicio, los Negocios deben crear una cuenta proporcionando información veraz y actualizada. Sos responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades realizadas bajo tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Planes y pagos</h2>
            <p>Reunio ofrece un plan gratuito con funciones limitadas y planes pagos con funcionalidades adicionales. Los precios están expresados en pesos argentinos (ARS) e incluyen IVA cuando corresponde. Los pagos se procesan a través de Stripe y son no reembolsables, salvo lo establecido en la política de reembolsos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Reservas y pagos entre negocios y clientes</h2>
            <p>Las transacciones de pago de señas entre Negocios y sus Clientes se procesan a través de Mercado Pago. Reunio actúa como intermediario tecnológico y no es parte en dichos contratos. Cualquier disputa sobre servicios o reembolsos deberá resolverse directamente entre el Negocio y su Cliente.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Uso aceptable</h2>
            <p>El Servicio debe utilizarse únicamente para fines lícitos. Queda prohibido:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Publicar contenido falso, engañoso o ilegal</li>
              <li>Intentar acceder sin autorización a sistemas o datos de terceros</li>
              <li>Usar el Servicio para enviar comunicaciones no solicitadas (spam)</li>
              <li>Realizar ingeniería inversa o intentar extraer el código fuente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Propiedad intelectual</h2>
            <p>Todos los derechos de propiedad intelectual sobre el Servicio, incluyendo su diseño, código fuente y marca, pertenecen a Reunio. Se te otorga una licencia limitada, no exclusiva e intransferible para usar el Servicio según estos términos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitación de responsabilidad</h2>
            <p>En la máxima medida permitida por la ley, Reunio no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del Servicio. La responsabilidad total de Reunio no excederá el monto pagado por el usuario en los 12 meses previos al evento que originó el reclamo.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cambios significativos por email o mediante un aviso destacado en el Servicio. El uso continuado del Servicio tras la notificación implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Ley aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Contacto</h2>
            <p>Para consultas sobre estos términos, escribinos a <a href="mailto:legal@reunio.app" className="underline hover:text-foreground">legal@reunio.app</a> o usá nuestro <Link href="/contacto" className="underline hover:text-foreground">formulario de contacto</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
