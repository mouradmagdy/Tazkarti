import { type CreateSectionPayload } from "@/apis/venues-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateVenue } from "@/hooks/venues/useCreateVenue";
import { useGetVenues } from "@/hooks/venues/useGetVenues";
import { Armchair, Building2, Plus, Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface SectionDraft {
  id: string;
  name: string;
  rows: number;
  seatsPerRow: number;
  color: string;
}

const defaultSection = (): SectionDraft => ({
  id: crypto.randomUUID(),
  name: "Main",
  rows: 5,
  seatsPerRow: 10,
  color: "#7c3aed",
});

export default function VenueLayoutManager() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>([defaultSection()]);
  const venuesQuery = useGetVenues();
  const createVenue = useCreateVenue();

  const totalSeats = sections.reduce(
    (sum, section) => sum + section.rows * section.seatsPerRow,
    0,
  );

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Venue name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim() || undefined,
      sections: sections.map((section, sectionIndex) =>
        buildSectionPayload(section, sectionIndex),
      ),
    };

    createVenue.mutate(payload, {
      onSuccess: () => {
        toast.success("Venue layout created.");
        setOpen(false);
        setName("");
        setAddress("");
        setSections([defaultSection()]);
      },
    });
  };

  const updateSection = (
    id: string,
    field: keyof Omit<SectionDraft, "id">,
    value: string | number,
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, [field]: value } : section,
      ),
    );
  };

  return (
    <div className="mb-6 rounded border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-left text-lg font-medium">
            <Building2 className="h-5 w-5 text-purple-600" />
            Venue Layouts
          </h2>
          <p className="text-left text-sm text-muted-foreground">
            {venuesQuery.data?.length ?? 0} layouts available for assigned-seat events
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Layout
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {venuesQuery.data?.map((venue) => (
          <div key={venue.id} className="rounded border bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-left text-sm font-medium">{venue.name}</h3>
                <p className="text-left text-xs text-muted-foreground">
                  {venue.address || "No address"}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Armchair className="h-3.5 w-3.5" />
                {venue.seatCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Venue Layout</DialogTitle>
            <DialogDescription>
              Generate sections, rows, and seats for assigned-seat events.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Venue name
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm">
                Address
                <Input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </label>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <div key={section.id} className="rounded border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Section {index + 1}</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={sections.length === 1}
                      onClick={() =>
                        setSections((current) =>
                          current.filter((item) => item.id !== section.id),
                        )
                      }
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="grid gap-1 text-sm">
                      Name
                      <Input
                        value={section.name}
                        onChange={(event) =>
                          updateSection(section.id, "name", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Rows
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={section.rows}
                        onChange={(event) =>
                          updateSection(section.id, "rows", Number(event.target.value))
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Seats / row
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={section.seatsPerRow}
                        onChange={(event) =>
                          updateSection(
                            section.id,
                            "seatsPerRow",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Color
                      <Input
                        type="color"
                        value={section.color}
                        onChange={(event) =>
                          updateSection(section.id, "color", event.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSections((current) => [
                    ...current,
                    {
                      ...defaultSection(),
                      name: `Section ${current.length + 1}`,
                    },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
              <span className="text-sm text-muted-foreground">
                {totalSeats} seats will be generated
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createVenue.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createVenue.isPending}>
                {createVenue.isPending ? "Creating..." : "Create Layout"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildSectionPayload(
  section: SectionDraft,
  displayOrder: number,
): CreateSectionPayload {
  const seats: CreateSectionPayload["seats"] = [];
  const startY = 105 + displayOrder * 160;

  for (let rowIndex = 0; rowIndex < section.rows; rowIndex += 1) {
    const row = String.fromCharCode(65 + rowIndex);
    for (let seatIndex = 1; seatIndex <= section.seatsPerRow; seatIndex += 1) {
      seats.push({
        row,
        number: String(seatIndex),
        label: `${row}-${seatIndex}`,
        x: 120 + (seatIndex - 1) * 34,
        y: startY + rowIndex * 34,
        isAccessible:
          rowIndex === section.rows - 1 && section.seatsPerRow >= 6 && seatIndex % 6 === 0,
      });
    }
  }

  return {
    name: section.name,
    displayOrder,
    color: section.color,
    seats,
  };
}
