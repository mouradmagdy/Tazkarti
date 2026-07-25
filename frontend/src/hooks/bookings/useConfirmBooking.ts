import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmBookingAPI } from "@/apis/booking-api";

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => confirmBookingAPI(eventId),
    onSuccess: () => {
      // Refetch user bookings so the card switches to "Booked"
      queryClient.invalidateQueries({ queryKey: ["userBookings"] });
    },
  });
}
