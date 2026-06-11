import { notFound } from "next/navigation";
import { getOrganizationBySlug, getServicesByOrganization } from "@/lib/organizations";
import BookingWizard from "./BookingWizard";
import DbDown from "@/components/DbDown";

interface Props {
  params: { slug: string };
  searchParams: { serviceId?: string; staffId?: string };
}

export default async function BookingPage({ params, searchParams }: Props) {
  try {
    const org = await getOrganizationBySlug(params.slug);
    if (!org) notFound();

    const services = await getServicesByOrganization(org.id);

    const settings = (org.settings ?? {}) as {
      cancellationHours?: number;
      cancellationPolicyText?: string;
    };

    return (
      <BookingWizard
        org={{ id: org.id, name: org.name, slug: org.slug, logoUrl: org.logo_url, timezone: org.timezone ?? "America/Argentina/Buenos_Aires" }}
        cancellationPolicy={{
          hours: settings.cancellationHours ?? 24,
          text: settings.cancellationPolicyText ?? "",
        }}
        services={services}
        preselectedServiceId={searchParams.serviceId ?? null}
        preselectedStaffId={searchParams.staffId ?? null}
      />
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return <DbDown context="booking" errorMessage={msg} />;
  }
}
