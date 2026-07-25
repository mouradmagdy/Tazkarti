import { releaseEventSeatsAPI } from "@/apis/booking-api";
import { useMutation } from "@tanstack/react-query";

export function useReleaseEventSeats() {
  return useMutation({
    mutationFn: ({
      eventId,
      eventSeatIds,
    }: {
      eventId: string;
      eventSeatIds: string[];
    }) => releaseEventSeatsAPI(eventId, eventSeatIds),
  });
}
