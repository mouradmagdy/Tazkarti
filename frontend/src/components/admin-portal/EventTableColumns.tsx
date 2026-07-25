import { format, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, File, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeleteEvents } from "@/hooks/events/useDeleteEvents";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventFormSchema, type EventFormData } from "./EventFormSchema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DatePickerField,
  SelectField,
  TextInputField,
} from "./AddEventFormFields";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useUpdateEvents } from "@/hooks/events/useUpdateEvents";
import toast from "react-hot-toast";
import { useGetEvent } from "@/hooks/events/useGetEvent";

const DetailsCell = ({ eventId }) => {
  const navigate = useNavigate();
  const { deleteEventMutation } = useDeleteEvents();
  const [openModal, setOpenModal] = useState(false);
  const { isPending: isUpdating, mutate: updateEvent } = useUpdateEvents();
  const { data, isPending } = useGetEvent(eventId);

  const handleDelete = (id: string) => {
    deleteEventMutation(id);
  };
  const form = useForm<EventFormData>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      name: "",
      venue: "",
      description: "",
      category: "",
      date: null,
      price: 0,
      image: "",
      totalSeats: 1,
    },
  });
  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name || "",
        venue: data.venue || "",
        description: data.description || "",
        category: data.category || "",
        date: data.date ? new Date(data.date) : null, // Convert to Date object if needed
        price: data.price || 0,
        image: data.image || "",
        totalSeats: data.totalSeats || 1,
      });
    }
  }, [data, form]);
  // 2. Define a submit handler.
  function onSubmit(values: EventFormData) {
    console.log("Form values:", values);
    const eventData = {
      name: values.name,
      venue: values.venue,
      description: values.description,
      category: values.category,
      date: format(new Date(values.date), "yyyy-MM-dd"),
      price: values.price,
      image: values.image,
      totalSeats: values.totalSeats,
    };
    updateEvent(
      { id: eventId, eventData },
      {
        onSuccess: () => {
          toast.success("Event updated successfully!");
          setOpenModal(false);
          form.reset();
        },
        onError: (error) => {
          console.error("Error updating event:", error);
        },
      },
    );
  }
  const categoryOptions = [
    { value: "music", label: "Music" },
    { value: "sports", label: "Sports" },
    { value: "art", label: "Art" },
    { value: "technology", label: "Technology" },
    { value: "other", label: "Other" },
  ];

  function handleView() {
    navigate(`/events/${eventId}`);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer text-2xl bg-inherit shadow-none  border-none">
          ...
        </DropdownMenuTrigger>
        <DropdownMenuContent className=" w-40  border-muted border rounded shadow-lg z-50 fixed -right-4">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleView}
            className="cursor-pointer flex items-center"
          >
            <Eye /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenModal(true)}
            className="cursor-pointer flex items-center"
          >
            <File /> Update Event
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDelete(eventId)}
            className="cursor-pointer flex items-center"
          >
            <Trash /> Delete Event
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {!isPending && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-muted-foreground">
                Update Event
              </DialogTitle>
              <DialogDescription>
                Such as event name, date, venue, and description.
              </DialogDescription>
            </DialogHeader>
            <FormProvider {...form}>
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
                    // value={data?.name}
                  />
                  <TextInputField
                    control={form.control}
                    name="venue"
                    label="Venue"
                    placeholder="Enter venue"
                  />
                </div>
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
                          placeholder="Enter price"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Seats</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded"
                          placeholder="Enter total seats"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <SelectField
                  control={form.control}
                  name="category"
                  label="Category"
                  placeholder="Select Category"
                  options={categoryOptions}
                />
                <div className="flex items-center gap-5">
                  <div className="mt-2">
                    <DatePickerField
                      control={form.control}
                      name="date"
                      label="Date"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button
                    className="rounded bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setOpenModal(false);
                      form.reset();
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isUpdating}
                    className="rounded hover:bg-blue-800"
                    type="submit"
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export const columns = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
          <img
            src={row.original.image}
            alt={row.original.name}
            loading="lazy"
            className="h-full w-full rounded-full"
          />
        </div>
        <div>
          <p className="font-medium">{row.original.name}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded-full text-sm  `}>
        {/* {getValue()} */}
        {row.original.category}
      </span>
    ),
  },

  {
    accessorKey: "venue",
    header: "Venue",
    cell: ({ row }) => (
      <div>
        <p className="">{row.original.venue}</p>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <div>
        <p className="text-sm ">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(row.original.price)}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div>
        <p className="text-sm ">
          {new Date(row.original.date).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <div>
        <p className="text-sm ">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    ),
  },

  {
    accessorKey: "details",
    header: "",
    cell: ({ row }) => <DetailsCell eventId={row.original.id} />,
  },
];
