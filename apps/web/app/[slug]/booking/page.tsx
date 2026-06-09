import { notFound } from "next/navigation";
import { getOrganizationBySlug, getServicesByOrganization, getStaffByOrganization } from "@/lib/organizations";
import BookingWizard from "./BookingWizard";

interface Props {
  params: { slug: string };
  searchParams: { serviceId?: string };
}

export default async function BookingPage({ params, searchParams }: Props) {
  const org = await getOrganizationBySlug(params.slug);
  if (!org) notFound();

  const [services, staffList] = await Promise.all([
    getServicesByOrganization(org.id),
    getStaffByOrganization(org.id),
  ]);

  const preselectedServiceId = searchParams.serviceId ?? null;

  return (
    <BookingWizard
      org={{ id: org.id, name: org.name, slug: org.slug, logoUrl: org.logo_url }}
      services={services}
      staffList={staffList}
      preselectedServiceId={preselectedServiceId}
    />
  );
}
