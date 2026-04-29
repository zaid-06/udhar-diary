import { api } from "./api";

export type PartyType = "customer" | "student" | "member";

export type Party = {
  id: number;
  categoryId: number;
  name: string;
  mobile: string;
  type: PartyType;
  totalAmount: number;
  reminderEnabled: boolean;
  createdAt: string;
};

export type CreatePartyInput = {
  name: string;
  mobile: string;
  categoryId: number;
  type: PartyType;
  class?: string;
  rollNumber?: string;
};

export async function fetchPartiesByCategory(categoryId: number): Promise<Party[]> {
  const { data } = await api.get<Party[]>("/v1/parties", {
    params: { categoryId },
  });
  return data;
}

export async function createParty(input: CreatePartyInput): Promise<Party> {
  const { data } = await api.post<Party>("/v1/parties", input);
  return data;
}

export type TogglePartyReminderResponse = {
  id: number;
  reminderEnabled: boolean;
};

export async function togglePartyReminder(partyId: number): Promise<TogglePartyReminderResponse> {
  const { data } = await api.patch<TogglePartyReminderResponse>(`/v1/parties/${partyId}/reminder`);
  return data;
}

