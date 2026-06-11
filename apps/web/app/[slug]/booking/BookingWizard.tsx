"use client";
import { useEffect } from "react";
import { useBookingStore } from "./store";
import StepProgress from "./components/StepProgress";
import Step1Service from "./components/Step1Service";
import Step2Staff from "./components/Step2Staff";
import Step3DateTime from "./components/Step3DateTime";
import Step4ClientData from "./components/Step4ClientData";
import Step5Confirm from "./components/Step5Confirm";
import Step6Success from "./components/Step6Success";

interface Props {
  org: { id: string; name: string; slug: string; logoUrl: string | null; timezone: string };
  cancellationPolicy: { hours: number; text: string };
  services: {
    id: string; name: string; description: string | null;
    duration_minutes: number; price: number | null;
    deposit_amount: number | null; deposit_percent: number | null;
    color: string | null; category: string | null;
  }[];
  preselectedServiceId: string | null;
  preselectedStaffId: string | null;
}

export default function BookingWizard({ org, cancellationPolicy, services, preselectedServiceId, preselectedStaffId }: Props) {
  const { step, setStep, setService, setStaff, organizationId } = useBookingStore();

  // Initialize store with org data
  useEffect(() => {
    useBookingStore.setState({ organizationId: org.id, slug: org.slug });

    if (preselectedServiceId) {
      const svc = services.find((s) => s.id === preselectedServiceId);
      if (svc) {
        setService({
          id: svc.id,
          name: svc.name,
          description: svc.description,
          durationMinutes: svc.duration_minutes,
          price: svc.price,
          depositAmount: svc.deposit_amount,
          depositPercent: svc.deposit_percent,
          color: svc.color,
        });
        if (preselectedStaffId) {
          setStaff({ id: preselectedStaffId, name: "", avatarUrl: null });
          setStep(3);
        } else {
          setStep(2);
        }
        return;
      }
    }
    if (preselectedStaffId) {
      setStaff({ id: preselectedStaffId, name: "", avatarUrl: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mappedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.duration_minutes,
    price: s.price,
    depositAmount: s.deposit_amount,
    depositPercent: s.deposit_percent,
    color: s.color,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {org.name[0]}
            </div>
          )}
          <span className="font-semibold text-sm">{org.name}</span>
        </div>
        {step < 6 && <StepProgress current={step} total={5} />}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 1 && <Step1Service services={mappedServices} />}
        {step === 2 && <Step2Staff />}
        {step === 3 && <Step3DateTime organizationId={org.id} timezone={org.timezone} />}
        {step === 4 && <Step4ClientData policy={cancellationPolicy} orgName={org.name} />}
        {step === 5 && <Step5Confirm organizationId={org.id} />}
        {step === 6 && <Step6Success slug={org.slug} />}
      </div>
    </div>
  );
}
