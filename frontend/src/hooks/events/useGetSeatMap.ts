import { getSeatMapAPI } from "@/apis/events-api";
import { useQuery } from "@tanstack/react-query";

export function useGetSeatMap(eventId: string) {
  return useQuery({
    queryKey: ["seat-map", eventId],
    queryFn: () => getSeatMapAPI(eventId),
    enabled: Boolean(eventId),
    refetchInterval: 15000,
  });
}
