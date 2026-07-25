import AssignedSeatPicker from "@/components/AssignedSeatPicker";
import EventDetailSkeleton from "@/components/EventDetailSkeleton";
import { Separator } from "@/components/ui/separator";
import { useGetEvent } from "@/hooks/events/useGetEvent";
import { useGetSeatMap } from "@/hooks/events/useGetSeatMap";
import { useParams } from "react-router-dom";

const EventDetail = () => {
  const { id } = useParams();
  const eventId = id ?? "";
  const { isPending, data } = useGetEvent(eventId);
  const seatMapQuery = useGetSeatMap(eventId);

  if (isPending) {
    return <EventDetailSkeleton />;
  }

  if (!data || !eventId) {
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

  const isSoldOut = availableSeats <= 0;

  return (
    <div>
      <div>
        <img className="h-72 w-full rounded object-cover" src={image} alt={name} />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-left text-xl font-normal">{name}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isSoldOut
                ? "bg-gray-200 text-gray-700"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isSoldOut ? "Sold out" : `${availableSeats} available`}
          </span>
        </div>
        <p className="flex items-center gap-2 text-sm">
          Venue:
          <span className="font-medium">{venue}</span>
        </p>
        <p className="flex items-center gap-2 text-sm">
          From:
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
      <Separator className="my-4" />

      {seatMapQuery.isPending ? (
        <div className="rounded border p-6 text-sm text-muted-foreground">
          Loading seat map...
        </div>
      ) : seatMapQuery.isError ? (
        <div className="rounded border p-6 text-sm text-muted-foreground">
          Seat map is not available for this event yet.
        </div>
      ) : (
        <AssignedSeatPicker eventId={eventId} seatMap={seatMapQuery.data} />
      )}
    </div>
  );
};

export default EventDetail;
