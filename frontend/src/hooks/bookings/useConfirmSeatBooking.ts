import { confirmSeatBookingAPI } from "@/apis/booking-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useConfirmSeatBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      eventSeatIds,
    }: {
      eventId: string;
      eventSeatIds: string[];
    }) => confirmSeatBookingAPI(eventId, eventSeatIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["event", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({
        queryKey: ["seat-map", variables.eventId],
      });
    },
  });
}
