import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmBooking } from "@/hooks/bookings/useConfirmBooking";
import { releaseLockAPI } from "@/apis/booking-api";
import { CalendarDays, Clock, MapPin, X } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface BookingModalProps {
  event: {
    id: string;
    name: string;
    date: string;
    venue: string;
  };
  initialSeconds: number; // comes from the lock response
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

  // Countdown tick
  useEffect(() => {
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, []); // run once on mount

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / initialSeconds; // 1 → 0
  const circumference = 2 * Math.PI * 28; // radius 28
  const strokeDashoffset = circumference * (1 - progress);

  // Urgency colour: green → amber → red
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
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ?? "Confirmation failed. Try again.";
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
      // best-effort — lock will expire on its own anyway
    }
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top colour bar — drains like a progress bar */}
        <div className="h-1 bg-gray-100 w-full">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: ringColour,
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {expired ? (
            /* ── Expired state ── */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Reservation expired
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Your 10-minute hold has expired. The seat has been released —
                you can try booking again.
              </p>
              <Button
                onClick={onClose}
                className="w-full bg-purple-700 hover:bg-purple-800"
              >
                Close
              </Button>
            </div>
          ) : (
            /* ── Active state ── */
            <>
              <div className="flex items-start gap-4 mb-6">
                {/* Countdown ring */}
                <div className="relative flex-shrink-0 w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
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
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">
                    Seat reserved
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                    {event.name}
                  </h2>
                </div>
              </div>

              {/* Event details */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="w-4 h-4 text-purple-600 flex-shrink-0" />
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
                  <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  {event.venue}
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mb-5">
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
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
