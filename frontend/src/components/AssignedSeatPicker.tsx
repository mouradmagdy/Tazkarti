import type { SeatMapResponse, SeatMapSeat } from "@/apis/events-api";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useConfirmSeatBooking } from "@/hooks/bookings/useConfirmSeatBooking";
import { useLockEventSeats } from "@/hooks/bookings/useLockEventSeats";
import { useReleaseEventSeats } from "@/hooks/bookings/useReleaseEventSeats";
import axios from "axios";
import { Armchair, Clock, Ticket, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface AssignedSeatPickerProps {
  eventId: string;
  seatMap: SeatMapResponse;
}

interface PositionedSeat extends SeatMapSeat {
  sectionId: string;
  sectionName: string;
  displayX: number;
  displayY: number;
}

const seatClassByStatus = {
  available: "fill-emerald-500 stroke-emerald-700",
  held: "fill-amber-400 stroke-amber-600",
  sold: "fill-gray-400 stroke-gray-600",
  selected: "fill-sky-500 stroke-sky-700",
  locked: "fill-purple-600 stroke-purple-800",
};

const swatchClassByStatus = {
  available: "border-emerald-700 bg-emerald-500",
  held: "border-amber-600 bg-amber-400",
  sold: "border-gray-600 bg-gray-400",
  selected: "border-sky-700 bg-sky-500",
  locked: "border-purple-800 bg-purple-600",
};

const SEAT_MAP_CENTER_X = 460;

export default function AssignedSeatPicker({
  eventId,
  seatMap,
}: AssignedSeatPickerProps) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [heldSeatIds, setHeldSeatIds] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const lockSeats = useLockEventSeats();
  const confirmSeats = useConfirmSeatBooking();
  const releaseSeats = useReleaseEventSeats();

  const positionedSeats = useMemo(() => positionSeats(seatMap), [seatMap]);
  const selectedSeats = positionedSeats.filter((seat) =>
    selectedSeatIds.includes(seat.eventSeatId),
  );
  const heldSeats = positionedSeats.filter((seat) =>
    heldSeatIds.includes(seat.eventSeatId),
  );
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const hasHold = heldSeatIds.length > 0;
  const isBusy =
    lockSeats.isPending || confirmSeats.isPending || releaseSeats.isPending;

  useEffect(() => {
    if (!hasHold || secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setHeldSeatIds([]);
          setSelectedSeatIds([]);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasHold, secondsLeft]);

  const toggleSeat = (seat: SeatMapSeat) => {
    if (hasHold || seat.status !== "available") {
      return;
    }

    setSelectedSeatIds((current) =>
      current.includes(seat.eventSeatId)
        ? current.filter((id) => id !== seat.eventSeatId)
        : [...current, seat.eventSeatId],
    );
  };

  const handleReserve = async () => {
    if (!authUser) {
      toast("Please login to reserve seats");
      navigate("/login");
      return;
    }

    if (selectedSeatIds.length === 0) {
      toast.error("Select at least one seat.");
      return;
    }

    try {
      const response = await lockSeats.mutateAsync({
        eventId,
        eventSeatIds: selectedSeatIds,
      });
      setHeldSeatIds(selectedSeatIds);
      setSecondsLeft(response.expiresInSeconds);
      toast.success("Seats reserved. Complete your booking.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Seat reservation failed."));
    }
  };

  const handleCancelHold = async () => {
    if (heldSeatIds.length === 0) {
      setSelectedSeatIds([]);
      return;
    }

    try {
      await releaseSeats.mutateAsync({ eventId, eventSeatIds: heldSeatIds });
    } catch {
      // The hold will expire even if early release fails.
    } finally {
      setHeldSeatIds([]);
      setSelectedSeatIds([]);
      setSecondsLeft(0);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmSeats.mutateAsync({ eventId, eventSeatIds: heldSeatIds });
      toast.success("Booking confirmed!");
      navigate("/congratulations");
    } catch (error) {
      toast.error(getErrorMessage(error, "Booking confirmation failed."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-left">{seatMap.venueName}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <LegendItem className={swatchClassByStatus.available} label="Available" />
            <LegendItem className={swatchClassByStatus.selected} label="Selected" />
            <LegendItem className={swatchClassByStatus.locked} label="Your reservation" />
            <LegendItem className={swatchClassByStatus.held} label="Held by others" />
            <LegendItem className={swatchClassByStatus.sold} label="Sold" />
          </div>
        </div>

        <div className="overflow-x-auto rounded border bg-background p-4">
          <svg
            viewBox="0 0 920 560"
            role="img"
            aria-label={`${seatMap.eventName} seat map`}
            className="h-[520px] min-w-[760px] w-full"
          >
            <rect x="240" y="20" width="440" height="38" rx="6" className="fill-muted" />
            <text
              x="460"
              y="45"
              textAnchor="middle"
              className="fill-muted-foreground text-xs font-medium"
            >
              STAGE
            </text>
            {positionedSeats.map((seat) => {
              const selected = selectedSeatIds.includes(seat.eventSeatId);
              const locked = heldSeatIds.includes(seat.eventSeatId);
              const statusClass = locked
                ? seatClassByStatus.locked
                : selected
                  ? seatClassByStatus.selected
                  : seatClassByStatus[seat.status];
              const disabled = hasHold || seat.status !== "available";

              return (
                <g
                  key={seat.eventSeatId}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={`${seat.sectionName} ${seat.label}, ${seat.status}, ${formatCurrency(seat.price)}`}
                  aria-pressed={selected}
                  onClick={() => toggleSeat(seat)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSeat(seat);
                    }
                  }}
                  className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
                >
                  <title>
                    {seat.sectionName} {seat.label} - {formatCurrency(seat.price)}
                  </title>
                  <circle
                    cx={seat.displayX}
                    cy={seat.displayY}
                    r="11"
                    className={`${statusClass} stroke-2 transition-opacity ${
                      disabled && !locked ? "opacity-70" : "hover:opacity-85"
                    }`}
                  />
                  <text
                    x={seat.displayX}
                    y={seat.displayY + 4}
                    textAnchor="middle"
                    className="pointer-events-none fill-white text-[8px] font-semibold"
                  >
                    {seat.number}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {seatMap.sections.map((section) => (
            <div key={section.id} className="rounded border p-4">
              <h3 className="mb-3 text-left text-sm font-medium">{section.name}</h3>
              <div className="flex flex-wrap gap-2">
                {section.seats.map((seat) => {
                  const selected = selectedSeatIds.includes(seat.eventSeatId);
                  const locked = heldSeatIds.includes(seat.eventSeatId);
                  const unavailable = hasHold || seat.status !== "available";

                  return (
                    <button
                      key={seat.eventSeatId}
                      type="button"
                      onClick={() => toggleSeat(seat)}
                      disabled={unavailable && !locked}
                      className={`h-9 min-w-12 rounded border px-2 text-xs font-medium ${
                        locked
                          ? "border-purple-700 bg-purple-600 text-white"
                          : selected
                            ? "border-sky-700 bg-sky-500 text-white"
                            : seat.status === "available"
                              ? "border-emerald-700 bg-emerald-500 text-white"
                              : seat.status === "held"
                                ? "border-amber-600 bg-amber-400 text-black"
                                : "border-gray-600 bg-gray-400 text-white"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                      title={`${section.name} ${seat.label}`}
                    >
                      {seat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium">Selected Seats</h2>
          {hasHold && (
            <span className="flex items-center gap-1 text-sm font-medium text-purple-600">
              <Clock className="h-4 w-4" />
              {formatTimer(secondsLeft)}
            </span>
          )}
        </div>

        <div className="min-h-24 space-y-2">
          {(hasHold ? heldSeats : selectedSeats).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No seats selected
            </p>
          ) : (
            (hasHold ? heldSeats : selectedSeats).map((seat) => (
              <div
                key={seat.eventSeatId}
                className="flex items-center justify-between rounded bg-muted/60 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-purple-600" />
                  {seat.sectionName} {seat.label}
                </span>
                <span className="font-medium">{formatCurrency(seat.price)}</span>
              </div>
            ))
          )}
        </div>

        <div className="my-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold">{formatCurrency(totalPrice)}</span>
        </div>

        {hasHold ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancelHold}
              disabled={isBusy}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={isBusy}>
              <Ticket className="mr-2 h-4 w-4" />
              Confirm
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleReserve}
            disabled={isBusy || selectedSeatIds.length === 0}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Reserve Seats
          </Button>
        )}
      </aside>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-full border ${className}`} />
      {label}
    </span>
  );
}

function positionSeats(seatMap: SeatMapResponse): PositionedSeat[] {
  const rawPositioned: PositionedSeat[] = [];
  const sectionHeight = 150;

  seatMap.sections.forEach((section, sectionIndex) => {
    const hasCoordinates = section.seats.some((seat) => seat.x !== 0 || seat.y !== 0);
    const rowMap = new Map<string, SeatMapSeat[]>();

    section.seats.forEach((seat) => {
      const rowSeats = rowMap.get(seat.row) ?? [];
      rowSeats.push(seat);
      rowMap.set(seat.row, rowSeats);
    });

    const rowNames = Array.from(rowMap.keys()).sort();
    rowNames.forEach((row, rowIndex) => {
      const rowSeats = (rowMap.get(row) ?? []).sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true }),
      );

      rowSeats.forEach((seat, seatIndex) => {
        rawPositioned.push({
          ...seat,
          sectionId: section.id,
          sectionName: section.name,
          displayX: hasCoordinates
            ? Number(seat.x)
            : 140 + seatIndex * Math.min(42, 680 / Math.max(rowSeats.length, 1)),
          displayY: hasCoordinates
            ? Number(seat.y)
            : 105 + sectionIndex * sectionHeight + rowIndex * 34,
        });
      });
    });
  });

  if (rawPositioned.length === 0) {
    return rawPositioned;
  }

  const xValues = rawPositioned.map((seat) => seat.displayX);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const xOffset = SEAT_MAP_CENTER_X - (minX + maxX) / 2;

  return rawPositioned.map((seat) => ({
    ...seat,
    displayX: seat.displayX + xOffset,
  }));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message || fallback
    : fallback;
}
