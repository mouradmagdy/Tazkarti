import HomeSkeleton from "@/components/HomeSkeleton";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useGetUserBookings } from "@/hooks/bookings/useGetUserBookings";
import { useGetAllEvents } from "@/hooks/events/useGetAllEvents";
import { CalendarDays, DollarSign, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Event {
  name: string;
  date: string;
  venue: string;
  price: number;
  category: string;
  id: string;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
  image: string;
}

const Home = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isPending } = useGetAllEvents(pageNumber, pageSize);
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const { data: userBookings } = useGetUserBookings(authUser?.id ?? "");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://res.cloudinary.com";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  if (isPending) {
    return <HomeSkeleton />;
  }

  const totalPages = data?.totalEvents;
  const totalPagesCount = Math.ceil(totalPages / pageSize);

  const handleNextPage = () => {
    if (pageNumber < (totalPagesCount || 1)) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber((prev) => prev - 1);
    }
  };

  const resetPageNumber = () => {
    setPageNumber(1);
  };

  const isEventPast = (eventDate: string) => {
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);
    return eventDateObj < currentDate;
  };

  const eventBookingsCount = (eventId: string) => {
    if (!userBookings?.bookings) {
      return 0;
    }

    return userBookings.bookings.filter(
      (booking) => booking?.event?.id === eventId,
    ).length;
  };

  return (
    <div className="mx-auto">
      <h1 className="text-left text-3xl font-medium">Events</h1>

      <div className="my-10 grid grid-cols-1 rounded-lg lg:grid-cols-2">
        {data.events.map((event: Event, index: number) => {
          const past = isEventPast(event.date);
          const bookingCount = eventBookingsCount(event.id);

          return (
            <div
              key={event.id}
              className={`group m-2 flex flex-col overflow-hidden rounded-lg border shadow-md transition-shadow duration-300 hover:shadow-xl ${
                past && "opacity-50"
              }`}
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.name}
                  className="mb-4 h-full w-full transform object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
              <div className="p-3">
                <h2 className="mb-1 p-2 text-left text-xl font-medium">
                  {event.name}
                </h2>
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4 text-purple-600" />
                      {new Date(event.date).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <div className="mr-2 flex items-center rounded-full bg-purple-700 px-6 py-1 text-sm text-white">
                      {event.category}
                    </div>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    {event.venue}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(event.price)}
                    </span>
                  </p>
                </div>
                <div className="flex w-full items-center justify-between p-4">
                  <Link
                    to={`/events/${event.id}`}
                    className="text-base text-purple-600 hover:text-purple-800"
                  >
                    View Details
                  </Link>
                  <div className="text-sm text-gray-600">
                    {bookingCount > 0 && (
                      <span className="text-gray-500">
                        x{bookingCount}{" "}
                        {bookingCount === 1 ? "Booking" : "Bookings"}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="px-5"
                    disabled={past}
                  >
                    {past ? "Event has passed" : "Select Seats"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
        totalPages={totalPagesCount}
        currentPage={pageNumber}
        pageSize={pageSize}
        setPageSize={setPageSize}
        resetPageNumber={resetPageNumber}
      />
    </div>
  );
};

export default Home;
