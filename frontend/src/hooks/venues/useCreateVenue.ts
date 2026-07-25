import { createVenueAPI, type CreateVenuePayload } from "@/apis/venues-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVenuePayload) => createVenueAPI(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
