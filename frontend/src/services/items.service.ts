import { api } from "./api";

export type CustomerItem = {
  id: number;
  partyId: number;
  customerId: number;
  name: string;
  itemName: string;
  amount: number | string;
  createdAt: string;
};

export type AddItemInput = {
  partyId: number;
  customerId?: number;
  itemName: string;
  amount: number;
};

export async function fetchCustomerItems(customerId: number): Promise<CustomerItem[]> {
  const { data } = await api.get<CustomerItem[]>(`/v1/items/${customerId}`);
  return data.map((row) => ({
    ...row,
    customerId: row.partyId,
    itemName: row.itemName ?? row.name,
  }));
}

export async function addItemToCustomer(input: AddItemInput): Promise<CustomerItem> {
  const { data } = await api.post<CustomerItem>("/v1/items", {
    partyId: input.partyId ?? input.customerId,
    name: input.itemName,
    amount: input.amount,
  });
  return {
    ...data,
    customerId: data.partyId,
    itemName: data.itemName ?? data.name,
  };
}

