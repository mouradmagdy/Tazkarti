import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { format } from "date-fns";

import toast from "react-hot-toast";

import {
  DatePickerField,
  SelectField,
  TextInputField,
} from "./admin-portal/AddEventFormFields";
import {
  EventFormSchema,
  type EventFormData,
} from "./admin-portal/EventFormSchema";
import { useAddEvents } from "@/hooks/events/useAddEvents";
import { useGetVenues } from "@/hooks/venues/useGetVenues";

interface TableFiltersProps {
  addContent?: string;
  searchValue: string;
  setSearchValue: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
}

const TableFilters = ({
  addContent = "Add Event",
  searchValue,
  setSearchValue,
  sortBy,
  setSortBy,
}: TableFiltersProps) => {
  const [openModal, setOpenModal] = useState(false);

  const { isPending: isSubmitting, mutate: addEvent } = useAddEvents();
  const venuesQuery = useGetVenues();
  const form = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      name: "",
      venue: "",
      venueId: "",
      description: "",
      category: "",
      date: null,
      price: 0,
      image: undefined,
    },
  });

  function onSubmit(values: EventFormData) {
    if (!(values.image instanceof File)) {
      form.setError("image", {
        type: "manual",
        message: "An image file is required.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("venue", values.venue);
    formData.append("venueId", values.venueId);
    formData.append("description", values.description);
    formData.append("category", values.category);
    formData.append("date", format(new Date(values.date), "yyyy-MM-dd"));
    formData.append("price", values.price.toString());
    formData.append("image", values.image);

    addEvent(formData, {
      onSuccess: () => {
        toast.success("Event added successfully!");
        setOpenModal(false);
        form.reset();
      },
      onError: (error) => {
        console.error("Error adding event:", error);
      },
    });
  }
  const categoryOptions = [
    { value: "music", label: "Music" },
    { value: "sports", label: "Sports" },
    { value: "art", label: "Art" },
    { value: "technology", label: "Technology" },
    { value: "other", label: "Other" },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-grow mb-5">
        {/*Sort By Select*/}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px] cursor-pointer">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="z-auto  cursor-pointer ">
            <SelectGroup>
              <SelectLabel>Name</SelectLabel>
              <SelectItem className="cursor-pointer" value="name-asc">
                Sort by name (A-Z)
              </SelectItem>
              <SelectItem className="cursor-pointer" value="name-desc">
                Sort by name (Z-A)
              </SelectItem>
              <SelectSeparator />
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>price</SelectLabel>
              <SelectItem className="cursor-pointer" value="price-asc">
                Lowest to highest{" "}
              </SelectItem>
              <SelectItem className="cursor-pointer" value="price-desc">
                Highest to lowest{" "}
              </SelectItem>
              <SelectSeparator />
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Date</SelectLabel>
              <SelectItem className="cursor-pointer" value="date-asc">
                Nearest{" "}
              </SelectItem>
              <SelectItem className="cursor-pointer" value="date-desc">
                Farthest{" "}
              </SelectItem>
              <SelectSeparator />
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by name or by email address"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Button
          onClick={() => setOpenModal(!openModal)}
          className="bg-primary text-primary-foreground hover:bg-muted hover:text-muted-foreground"
        >
          <Plus />
          {addContent}{" "}
        </Button>
      </div>

      <Dialog open={openModal} onOpenChange={(value) => setOpenModal(value)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-muted-foreground">
              Add Event
            </DialogTitle>
            <DialogDescription>
              Such as event name, date, venue, and description.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 text-muted-foreground"
            >
              <div className="flex items-center justify-between">
                <TextInputField
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder="Enter event name"
                />
                <FormField
                  control={form.control}
                  name="venueId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="text-start">Venue Layout</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const venue = venuesQuery.data?.find(
                            (item) => item.id === value,
                          );
                          form.setValue("venue", venue?.name ?? "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded">
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {venuesQuery.data?.map((venue) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name} ({venue.seatCount} seats)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <input type="hidden" {...form.register("venue")} />
              <TextInputField
                control={form.control}
                name="description"
                label="Description"
                placeholder="Enter description"
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        className="rounded"
                        placeholder={"Enter price"}
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <SelectField
                  control={form.control}
                  name="category"
                  label="Category"
                  placeholder="Select Category"
                  options={categoryOptions}
                />
                {/* <div className="flex items-center gap-5">
                  <div className="mt-"> */}
                <DatePickerField
                  control={form.control}
                  name="date"
                  label="Date"
                />
                {/* </div>
                </div> */}
              </div>
              {/* Add Image Upload Field */}
              <FormField
                control={form.control}
                name="image"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Event Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          field.onChange(file);
                        }}
                      />
                    </FormControl>
                    {fieldState.error && (
                      <FormMessage>{fieldState.error.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button
                  className="rounded bg-destructive text-destructive-foreground"
                  onClick={() => {
                    setOpenModal(false);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting}
                  className="rounded hover:bg-blue-800"
                  type="submit"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableFilters;
