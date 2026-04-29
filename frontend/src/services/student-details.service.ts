import { api } from "./api";

export type StudentDetails = {
  id: number;
  partyId: number;
  class: string;
  rollNumber: string;
  createdAt: string;
};

export async function fetchStudentDetails(partyId: number): Promise<StudentDetails | null> {
  try {
    const { data } = await api.get<StudentDetails>(`/v1/student-details/${partyId}`);
    return data;
  } catch {
    return null;
  }
}
