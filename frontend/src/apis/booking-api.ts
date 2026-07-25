import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;

// Phase 1 — reserve a seat for 10 minutes
export async function lockSeatAPI(eventId: string) {
  const response = await axios.post(
    `${BASE}/api/bookings/lock`,
    { eventId },
    { withCredentials: true },
  );
  return response.data as { message: string; expiresInSeconds: number };
}

// Phase 2 — confirm the reservation and write to DB
export async function confirmBookingAPI(eventId: string) {
  const response = await axios.post(
    `${BASE}/api/bookings/confirm`,
    { eventId },
    { withCredentials: true },
  );
  return response.data;
}

// Release the lock early (user closes modal before confirming)
export async function releaseLockAPI(eventId: string) {
  await axios.delete(`${BASE}/api/bookings/lock/${eventId}`, {
    withCredentials: true,
  });
}

// Get lock status — used to restore countdown on page refresh
export async function getLockStatusAPI(eventId: string) {
  const response = await axios.get(
    `${BASE}/api/bookings/lock-status/${eventId}`,
    { withCredentials: true },
  );
  return response.data as { locked: boolean; remainingSeconds: number };
}

export async function getUserBookingsAPI(userId: string) {
  const response = await axios.get(`${BASE}/api/bookings/user/${userId}`, {
    withCredentials: true,
  });
  return response.data;
}
