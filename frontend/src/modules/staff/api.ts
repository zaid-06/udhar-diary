import { api } from "@/services/api";

export type StaffMember = {
  id: number;
  categoryId: number;
  name: string;
  mobile: string;
  role: string;
  salary: number;
  createdAt: string;
};

export type StaffSalaryLog = {
  id: number;
  staffId: number;
  amount: number;
  date: string;
  createdAt: string;
};

export const fetchStaff = async (categoryId: number) => {
  const { data } = await api.get<StaffMember[]>("/v1/staff", { params: { categoryId } });
  return data;
};

export const createStaff = async (payload: {
  categoryId: number;
  name: string;
  mobile: string;
  role: string;
  salary: number;
}) => {
  const { data } = await api.post<StaffMember>("/v1/staff", payload);
  return data;
};

export const createStaffSalaryLog = async (staffId: number, payload: { amount: number; date?: string }) => {
  const { data } = await api.post<StaffSalaryLog>(`/v1/staff/${staffId}/salary-logs`, payload);
  return data;
};

export const fetchStaffSalaryLogs = async (staffId: number) => {
  const { data } = await api.get<StaffSalaryLog[]>(`/v1/staff/${staffId}/salary-logs`);
  return data;
};
