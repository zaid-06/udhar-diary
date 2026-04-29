import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const normalizedBaseURL = rawBaseURL.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: `${normalizedBaseURL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

