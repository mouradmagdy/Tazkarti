import axios from "axios";
import toast from "react-hot-toast";

export interface EventResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  venue: string;
  venueId?: string | null;
  price: number;
  image?: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: string;
  createdById: string;
}

export interface SeatMapSeat {
  eventSeatId: string;
  seatId: string;
  row: string;
  number: string;
  label: string;
  x: number;
  y: number;
  isAccessible: boolean;
  price: number;
  status: "available" | "held" | "sold";
}

export interface SeatMapSection {
  id: string;
  name: string;
  displayOrder: number;
  color?: string | null;
  seats: SeatMapSeat[];
}

export interface SeatMapResponse {
  eventId: string;
  eventName: string;
  venueId?: string | null;
  venueName: string;
  sections: SeatMapSection[];
}

export const getAllEventsAPI = async (pageNumber, pageSize) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/events/getAllEvents`,
      {
        withCredentials: true,
        params: {
          pageNumber,
          pageSize,
        },
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to fetch events";
    toast.error(errorMessage);
    throw error;
  }
};

export const getEventById = async (id: string) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/events/getEventById/${id}`,
      {
        withCredentials: true,
      }
    );
    return response.data as EventResponse;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to fetch events";
    toast.error(errorMessage);
    throw error;
  }
};

export const getSeatMapAPI = async (eventId: string) => {
  try {
    const response = await axios.get<SeatMapResponse>(
      `${import.meta.env.VITE_API_URL}/api/events/${eventId}/seat-map`,
      {
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to fetch seat map"
        : "Failed to fetch seat map";
    toast.error(errorMessage);
    throw error;
  }
};

export const createEventAPI = async (eventData) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/events/create`,
      eventData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to create event";
    toast.error(errorMessage);
    throw error;
  }
};
export const updateEventAPI = async (id: string, eventData) => {
  try {
    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/events/updateEvent/${id}`,
      eventData,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to update event";
    toast.error(errorMessage);
    throw error;
  }
};

export const deleteEventAPI = async (id: string) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/events/deleteEvent/${id}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Failed to delete event";
    toast.error(errorMessage);
    throw error;
  }
};
