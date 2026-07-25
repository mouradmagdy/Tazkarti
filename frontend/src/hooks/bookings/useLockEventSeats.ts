import { lockEventSeatsAPI } from "@/apis/booking-api";
import { useMutation } from "@tanstack/react-query";

export function useLockEventSeats() {
  return useMutation({
    mutationFn: ({
      eventId,
      eventSeatIds,
    }: {
      eventId: string;
      eventSeatIds: string[];
    }) => lockEventSeatsAPI(eventId, eventSeatIds),
  });
}
