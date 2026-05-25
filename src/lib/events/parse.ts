// Wave 43 — pure parse/validate of event-setup form input into the `events`
// table shape. Mirrors the schema's check(end_date >= start_date). Kept pure so
// the date/required rules are unit-testable; the Server Action calls it before
// inserting.

export type EventInput = {
  name: string;
  venue: string;
  startDate: string; // YYYY-MM-DD (from <input type="date">)
  endDate: string;
};

export type EventFields = {
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
};

export type ParseEventResult =
  | { ok: true; value: EventFields }
  | { ok: false; fieldErrors: Record<string, string> };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseEventInput(input: EventInput): ParseEventResult {
  const fieldErrors: Record<string, string> = {};

  const name = (input.name ?? "").trim();
  if (!name) fieldErrors.name = "Event name is required";
  else if (name.length > 160) fieldErrors.name = "Name is too long (max 160)";

  const venue = (input.venue ?? "").trim();
  if (venue.length > 160) fieldErrors.venue = "Venue is too long (max 160)";

  const start = (input.startDate ?? "").trim();
  const end = (input.endDate ?? "").trim();
  if (!ISO_DATE.test(start)) fieldErrors.startDate = "Pick a start date";
  if (!ISO_DATE.test(end)) fieldErrors.endDate = "Pick an end date";

  // YYYY-MM-DD compares correctly as strings (lexicographic = chronological).
  if (!fieldErrors.startDate && !fieldErrors.endDate && end < start) {
    fieldErrors.endDate = "End date can't be before the start date";
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    value: {
      name,
      venue: venue === "" ? null : venue,
      start_date: start,
      end_date: end,
    },
  };
}

export const EVENT_STATUSES = ["planned", "running", "closed", "archived"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export function isEventStatus(s: string): s is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(s);
}
