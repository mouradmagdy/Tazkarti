import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

export interface CreateSeatPayload {
  row: string;
  number: string;
  label?: string;
  x: number;
  y: number;
  isAccessible: boolean;
}

export interface CreateSectionPayload {
  name: string;
  displayOrder: number;
  color?: string;
  seats: CreateSeatPayload[];
}

export interface CreateVenuePayload {
  name: string;
  address?: string;
  sections: CreateSectionPayload[];
}

export interface VenueResponse {
  id: string;
  name: string;
  address?: string | null;
  seatCount: number;
  sections: Array<{
    id: string;
    name: string;
    displayOrder: number;
    color?: string | null;
    seats: Array<{
      id: string;
      row: string;
      number: string;
      label: string;
      x: number;
      y: number;
      isAccessible: boolean;
    }>;
  }>;
}

export async function getVenuesAPI() {
  try {
    const response = await axios.get<VenueResponse[]>(`${API_BASE_URL}/api/venues`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || "Failed to fetch venues"
      : "Failed to fetch venues";
    toast.error(message);
    throw error;
  }
}

export async function createVenueAPI(payload: CreateVenuePayload) {
  try {
    const response = await axios.post<VenueResponse>(
      `${API_BASE_URL}/api/venues`,
      payload,
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || "Failed to create venue layout"
      : "Failed to create venue layout";
    toast.error(message);
    throw error;
  }
}
