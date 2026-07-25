import { z } from "zod";

export const EventFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be at most 50 characters."),

  description: z
    .string()
    .min(10, "address must be at least 10 characters.")
    .max(1000, "address must be at least 10 characters."),

  category: z.string().min(3, "Category must be at least 3 characters."),
  date: z.date({
    required_error: "A date for the event is required.",
  }),

  venue: z
    .string()
    .min(2, "Venue must be at least 2 characters.")
    .max(50, "Venue must be at most 50 characters."),
  price: z
    .number()
    .min(0, "Price must be a positive number.")
    .max(100000, "Price must be at most 100000."),
  totalSeats: z
    .number()
    .min(1, "Total seats must be at least 1.")
    .max(1000, "Total seats must be at most 1000."),
  image: z
    .any()
    .refine((file) => file instanceof File, {
      message: "An image file is required.",
    })
    .refine((file) => file?.size > 0, {
      message: "Please select a valid image file.",
    }),
});
export type EventFormData = z.infer<typeof EventFormSchema>;
