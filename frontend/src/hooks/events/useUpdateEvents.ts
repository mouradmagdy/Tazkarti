import { updateEventAPI } from "@/apis/events-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateEvents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventData }: { id: string; eventData: FormData }) => {
      return updateEventAPI(id, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};
