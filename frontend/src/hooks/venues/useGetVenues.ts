import { getVenuesAPI } from "@/apis/venues-api";
import { useQuery } from "@tanstack/react-query";

export function useGetVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: getVenuesAPI,
  });
}
