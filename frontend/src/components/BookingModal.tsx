import { releaseLockAPI } from "@/apis/booking-api";
import { Button } from "@/components/ui/button";
import { useConfirmBooking } from "@/hooks/bookings/useConfirmBooking";
import axios from "axios";
import { CalendarDays, Clock, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface BookingModalProps {
  event: {
    id: string;
    name: string;
    date: string;
    venue: string;
  };
  initialSeconds: number;
  onClose: () => void;
}

export default function BookingModal({
  event,
  initialSeconds,
  onClose,
}: BookingModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { mutate: confirmBooking, isPending: confirming } = useConfirmBooking();

  useEffect(() => {
    if (initialSeconds <= 0) {
      setExpired(true);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          clearInterval(intervalRef.current!);
          setExpired(true);
          return 0;
        }
        return currentSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [initialSeconds]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = initialSeconds > 0 ? secondsLeft / initialSeconds : 0;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - progress);
  const ringColour =
    secondsLeft > 120 ? "#7c3aed" : secondsLeft > 45 ? "#f59e0b" : "#ef4444";

  const handleConfirm = () => {
    const confirmToast = toast.loading("Confirming your booking...");
    confirmBooking(event.id, {
      onSuccess: () => {
        clearInterval(intervalRef.current!);
        toast.success("Booking confirmed!", { id: confirmToast });
        onClose();
        navigate("/Congratulations");
      },
      onError: (err: unknown) => {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Confirmation failed. Try again."
          : "Confirmation failed. Try again.";
        toast.error(msg, { id: confirmToast });
        if (msg.toLowerCase().includes("expired")) {
          setExpired(true);
        }
      },
    });
  };

  const handleCancel = async () => {
    clearInterval(intervalRef.current!);
    try {
      await releaseLockAPI(event.id);
    } catch {
      // Best effort: the lock will expire on its own.
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: ringColour,
            }}
          />
        </div>

        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {expired ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Clock className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Reservation expired
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Your 5-minute hold has expired. The seat has been released. You
                can try booking again.
              </p>
              <Button
                onClick={onClose}
                className="w-full bg-purple-700 hover:bg-purple-800"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-4">
                <div className="relative h-16 w-16 flex-shrink-0">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke={ringColour}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: ringColour }}
                    >
                      {String(minutes).padStart(2, "0")}:
                      {String(seconds).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-purple-600">
                    Seat reserved
                  </p>
                  <h2 className="text-lg font-semibold leading-tight text-gray-900">
                    {event.name}
                  </h2>
                </div>
              </div>

              <div className="mb-6 space-y-2 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4 flex-shrink-0 text-purple-600" />
                  {new Date(event.date).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-purple-600" />
                  {event.venue}
                </div>
              </div>

              <p className="mb-5 text-center text-xs text-gray-400">
                Your seat is held for{" "}
                <span className="font-medium" style={{ color: ringColour }}>
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </span>
                . Complete the booking before the timer runs out.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={confirming}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-purple-700 hover:bg-purple-800"
                  disabled={confirming}
                >
                  {confirming ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
