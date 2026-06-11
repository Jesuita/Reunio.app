"use client";
import { create } from "zustand";

export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  depositAmount: number | null;
  depositPercent: number | null;
  color: string | null;
}

export interface StaffOption {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface SlotOption {
  staffId: string;
  staffName: string;
  startsAt: string; // ISO string
  endsAt: string;
}

export interface ClientData {
  name: string;
  phone: string;
  email: string;
  notes: string;
  acceptsPolicy: boolean;
  acceptsPrivacyPolicy: boolean;
}

interface BookingStore {
  step: BookingStep;
  organizationId: string;
  slug: string;

  // Selections
  service: ServiceOption | null;
  staff: StaffOption | null;   // null = "any available"
  selectedDate: string | null; // "YYYY-MM-DD"
  selectedSlot: SlotOption | null;
  client: ClientData;

  // Result
  createdBookingId: string | null;
  paymentUrl: string | null;
  manageUrl: string | null;

  // Actions
  setStep: (step: BookingStep) => void;
  setService: (service: ServiceOption) => void;
  setStaff: (staff: StaffOption | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedSlot: (slot: SlotOption) => void;
  setClient: (client: Partial<ClientData>) => void;
  setResult: (bookingId: string, paymentUrl: string | null, manageUrl: string | null) => void;
  reset: () => void;
}

const defaultClient: ClientData = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  acceptsPolicy: false,
  acceptsPrivacyPolicy: false,
};

export const useBookingStore = create<BookingStore>((set) => ({
  step: 1,
  organizationId: "",
  slug: "",
  service: null,
  staff: null,
  selectedDate: null,
  selectedSlot: null,
  client: defaultClient,
  createdBookingId: null,
  paymentUrl: null,
  manageUrl: null,

  setStep: (step) => set({ step }),
  setService: (service) => set({ service, staff: null, selectedDate: null, selectedSlot: null }),
  setStaff: (staff) => set({ staff, selectedDate: null, selectedSlot: null }),
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setClient: (partial) =>
    set((s) => ({ client: { ...s.client, ...partial } })),
  setResult: (bookingId, paymentUrl, manageUrl) =>
    set({ createdBookingId: bookingId, paymentUrl, manageUrl }),
  reset: () =>
    set({
      step: 1,
      service: null,
      staff: null,
      selectedDate: null,
      selectedSlot: null,
      client: defaultClient,
      createdBookingId: null,
      paymentUrl: null,
      manageUrl: null,
    }),
}));
