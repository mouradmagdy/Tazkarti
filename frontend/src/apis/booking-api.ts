import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;

export interface LockSeatResponse {
  message: string;
  expiresInSeconds: number;
}

export interface BookedSeat {
  eventSeatId: string;
  label: string;
  section: string;
  price: number;
}

export interface AssignedSeatBookingResponse {
  message: string;
  bookingId: string;
  eventId: string;
  status: string;
  totalPrice: number;
  seats: BookedSeat[];
}

export interface UserBookingsResponse {
  bookings: Array<{
    id: string;
    status: string;
    totalPrice: number;
    event: {
      id: string;
      name: string;
      date: string;
      venue: string;
    };
    seats: BookedSeat[];
  }>;
  count: number;
}

export async function lockEventSeatsAPI(eventId: string, eventSeatIds: string[]) {
  const response = await axios.post<LockSeatResponse>(
    `${BASE}/api/bookings/lock-seats`,
    { eventId, eventSeatIds },
    { withCredentials: true },
  );
  return response.data;
}

export async function confirmSeatBookingAPI(
  eventId: string,
  eventSeatIds: string[],
) {
  const response = await axios.post<AssignedSeatBookingResponse>(
    `${BASE}/api/bookings/confirm-seats`,
    { eventId, eventSeatIds },
    { withCredentials: true },
  );
  return response.data;
}

export async function releaseEventSeatsAPI(
  eventId: string,
  eventSeatIds: string[],
) {
  const response = await axios.post(
    `${BASE}/api/bookings/release-seats`,
    { eventId, eventSeatIds },
    { withCredentials: true },
  );
  return response.data as { message: string; released: number };
}

export async function getUserBookingsAPI(userId: string) {
  const response = await axios.get<UserBookingsResponse>(
    `${BASE}/api/bookings/user/${userId}`,
    { withCredentials: true },
  );
  return response.data;
}
