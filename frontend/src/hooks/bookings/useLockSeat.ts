import { useMutation } from "@tanstack/react-query";
import { lockSeatAPI } from "@/apis/booking-api";

export function useLockSeat() {
  return useMutation({
    mutationFn: (eventId: string) => lockSeatAPI(eventId),
  });
}
