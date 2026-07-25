import EventDetailSkeleton from "@/components/EventDetailSkeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/context/AuthContext";
import { useConfirmBooking } from "@/hooks/bookings/useConfirmBooking";
import { useLockSeat } from "@/hooks/bookings/useLockSeat";
import { useGetEvent } from "@/hooks/events/useGetEvent";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const EventDetail = () => {
  const { id } = useParams();
  const { isPending, data } = useGetEvent(id as string);
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const lockSeat = useLockSeat();
  const confirmBooking = useConfirmBooking();

  if (isPending) {
    return <EventDetailSkeleton />;
  }

  if (!data || !id) {
    return <div className="p-6 text-sm text-muted-foreground">Event not found.</div>;
  }

  const {
    name,
    date,
    venue,
    price,
    category,
    description,
    image,
    availableSeats,
    totalSeats,
  } = data;

  const isBooking = lockSeat.isPending || confirmBooking.isPending;
  const isSoldOut = availableSeats <= 0;

  const handleBooking = async () => {
    if (!authUser) {
      toast("Please login to book an event");
      navigate("/login");
      return;
    }

    const bookingToast = toast.loading("Reserving your seat...");

    try {
      await lockSeat.mutateAsync(id);
      toast.loading("Confirming your booking...", { id: bookingToast });
      await confirmBooking.mutateAsync(id);
      toast.success("Booking successful!", { id: bookingToast });
      navigate("/congratulations");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Booking failed. Please try again."
        : "Booking failed. Please try again.";
      toast.error(message, { id: bookingToast });
    }
  };

  return (
    <div>
      <div>
        <img className="h-72 w-full rounded object-cover" src={image} alt={name} />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h1 className="text-left text-xl font-normal">{name}</h1>
        <p className="flex items-center gap-2 text-sm">
          Venue:
          <span className="font-medium">{venue}</span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          Price:
          <span className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(price)}
          </span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          Category:
          <span className="font-medium">{category}</span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          Seats:
          <span className="font-medium">
            {availableSeats} of {totalSeats} available
          </span>
        </p>
        <p className="flex items-center gap-2 text-sm font-medium">
          {new Date(date).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>
      <Separator className="my-4" />
      <div className="pb-6 text-left text-sm text-gray-500">{description}</div>
      <div className="flex justify-center">
        <button
          onClick={handleBooking}
          className="flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-white transition duration-300 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBooking || isSoldOut}
        >
          {isBooking && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {isSoldOut ? "Sold Out" : "Book Now"}
        </button>
      </div>
    </div>
  );
};

export default EventDetail;
