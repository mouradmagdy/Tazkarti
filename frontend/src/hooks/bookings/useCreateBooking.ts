// import { createBookingAPI } from "@/apis/booking-api";
// import { useMutation, useQueryClient } from "@tanstack/react-query";

// export const useCreateBooking = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: createBookingAPI,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["bookings"] });
//     },
//   });
// };
