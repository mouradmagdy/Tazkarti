import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;

export interface LockSeatResponse {
  message: string;
  expiresInSeconds: number;
}

export interface LockStatusResponse {
  locked: boolean;
  remainingSeconds: number;
}

export interface ConfirmBookingResponse {
  message: string;
  bookingId: string;
  eventId: string;
  status: string;
}

// Phase 1: reserve a seat for 5 minutes.
export async function lockSeatAPI(eventId: string) {
  const response = await axios.post<LockSeatResponse>(
    `${BASE}/api/bookings/lock`,
    { eventId },
    { withCredentials: true },
  );
  return response.data;
}

// Phase 2: confirm the reservation and write it to SQL Server.
export async function confirmBookingAPI(eventId: string) {
  const response = await axios.post<ConfirmBookingResponse>(
    `${BASE}/api/bookings/confirm`,
    { eventId },
    { withCredentials: true },
  );
  return response.data;
}

export async function releaseLockAPI(eventId: string) {
  await axios.delete(`${BASE}/api/bookings/lock/${eventId}`, {
    withCredentials: true,
  });
}

export async function getLockStatusAPI(eventId: string) {
  const response = await axios.get<LockStatusResponse>(
    `${BASE}/api/bookings/lock-status/${eventId}`,
    { withCredentials: true },
  );
  return response.data;
}

export async function getUserBookingsAPI(userId: string) {
  const response = await axios.get(`${BASE}/api/bookings/user/${userId}`, {
    withCredentials: true,
  });
  return response.data;
}
