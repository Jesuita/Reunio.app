import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Clock, ChevronRight } from "lucide-react";
import { getOrganizationBySlug, getServicesByOrganization } from "@/lib/organizations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: { slug: string };
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatPrice(price: number | null, depositAmount: number | null, depositPercent: number | null) {
  if (!price) return null;
  const priceStr = `$${Number(price).toLocaleString("es-AR")}`;
  if (depositAmount) return `${priceStr} · Seña $${Number(depositAmount).toLocaleString("es-AR")}`;
  if (depositPercent) return `${priceStr} · Seña ${depositPercent}%`;
  return priceStr;
}

export default async function OrganizationPage({ params }: Props) {
  const org = await getOrganizationBySlug(params.slug);
  if (!org) notFound();

  const services = await getServicesByOrganization(org.id);

  // Group by category
  const categories = Array.from(new Set(services.map((s) => s.category ?? "Servicios")));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {org.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              {org.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {org.address}
                </span>
              )}
              {org.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {org.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {services.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Este negocio no tiene servicios publicados todavía.
          </p>
        ) : (
          categories.map((cat) => (
            <section key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {cat}
              </h2>
              <div className="space-y-2">
                {services
                  .filter((s) => (s.category ?? "Servicios") === cat)
                  .map((service) => {
                    const price = formatPrice(service.price, service.deposit_amount, service.deposit_percent);
                    return (
                      <Card key={service.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {service.color && (
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: service.color }}
                                />
                              )}
                              <span className="font-medium truncate">{service.name}</span>
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(service.duration_minutes)}
                              </span>
                              {price && (
                                <span className="text-xs font-medium text-foreground">{price}</span>
                              )}
                            </div>
                          </div>
                          <Link href={`/${params.slug}/booking?serviceId=${service.id}`}>
                            <Button size="sm" className="flex-shrink-0">
                              Reservar <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
