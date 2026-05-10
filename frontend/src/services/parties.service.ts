import { api } from "./api";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PartyType = "customer" | "student" | "member" | "supplier" | "staff" | "teacher" | "trainer";

export type Party = {
  id: string;
  categoryId: string;
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
  categoryId: string;
  type: PartyType;
  class?: string;
  rollNumber?: string;
};

export async function fetchPartiesByCategory(categoryId: string): Promise<Party[]> {
  const { data } = await api.get<ApiEnvelope<Array<{
    id: string;
    businessId: string;
    name: string;
    mobile: string;
    category: PartyType;
    totalAmount: number;
    reminderEnabled: boolean;
    createdAt: string;
  }>>>("/v1/entities", {
    params: { businessId: categoryId, category: "customer" },
  });
  return data.data.map((row) => ({
    id: row.id,
    categoryId: row.businessId,
    name: row.name,
    mobile: row.mobile,
    type: row.category,
    totalAmount: row.totalAmount,
    reminderEnabled: row.reminderEnabled,
    createdAt: row.createdAt,
  }));
}

export async function createParty(input: CreatePartyInput): Promise<Party> {
  const payload: Record<string, unknown> = {
    businessId: input.categoryId,
    name: input.name,
    mobile: input.mobile,
    category: input.type,
  };
  if (input.type === "student" && input.class && input.rollNumber) {
    payload.studentDetails = {
      class: input.class,
      rollNumber: input.rollNumber,
    };
  }
  const { data } = await api.post<ApiEnvelope<{
    id: string;
    businessId: string;
    name: string;
    mobile: string;
    category: PartyType;
    totalAmount: number;
    reminderEnabled: boolean;
    createdAt: string;
  }>>("/v1/entities", payload);
  return {
    id: data.data.id,
    categoryId: data.data.businessId,
    name: data.data.name,
    mobile: data.data.mobile,
    type: data.data.category,
    totalAmount: data.data.totalAmount,
    reminderEnabled: data.data.reminderEnabled,
    createdAt: data.data.createdAt,
  };
}

export type TogglePartyReminderResponse = {
  id: string;
  reminderEnabled: boolean;
};

export async function togglePartyReminder(partyId: string): Promise<TogglePartyReminderResponse> {
  const { data } = await api.patch<ApiEnvelope<TogglePartyReminderResponse>>(
    `/v1/entities/${partyId}/reminder`,
  );
  return data.data;
}

