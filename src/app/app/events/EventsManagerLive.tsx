"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { TextInput } from "@/components/ui/TextInput";
import { EmptyState } from "@/components/ui/States";
import { CalendarDays } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  createEvent,
  allocateActiveProducts,
  setEventStatus,
} from "./actions";
import type { EventStatus } from "@/lib/events/parse";
import { EventStockPanel } from "./EventStockPanel";

export type EventSummary = {
  id: string;
  name: string;
  venue: string | null;
  start_date: string;
  end_date: string;
  status: string;
  productCount: number;
  totalCurrentQty: number;
};

const STATUS_TONE: Record<string, "ok" | "accent" | "neutral" | "warn"> = {
  running: "ok",
  planned: "accent",
  closed: "neutral",
  archived: "neutral",
};

export function EventsManagerLive({
  events,
  activeProductCount,
  canManage,
  canAllocate,
}: {
  events: EventSummary[];
  activeProductCount: number;
  canManage: boolean;
  canAllocate: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", venue: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stockOpen, setStockOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const res = await createEvent(form);
      if (res.ok) {
        push({ kind: "success", title: "Event created", message: form.name });
        setForm({ name: "", venue: "", startDate: "", endDate: "" });
        setShowForm(false);
        router.refresh();
      } else {
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
      }
    });
  }

  function allocate(ev: EventSummary) {
    setBusyId(ev.id);
    startTransition(async () => {
      const res = await allocateActiveProducts(ev.id);
      if (res.ok) {
        push({
          kind: "success",
          title: "Products synced",
          message: `${res.allocated ?? 0} active product(s) allocated to ${ev.name}.`,
        });
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't allocate", message: res.error });
      }
      setBusyId(null);
    });
  }

  function changeStatus(ev: EventSummary, status: EventStatus, label: string) {
    setBusyId(ev.id);
    startTransition(async () => {
      const res = await setEventStatus(ev.id, status);
      if (res.ok) {
        push({ kind: "info", title: label, message: ev.name });
        router.refresh();
      } else {
        push({ kind: "error", title: "Couldn't update", message: res.error });
      }
      setBusyId(null);
    });
  }

  return (
    <div className="mt-6">
      {canManage && (
        <div className="mb-4">
          {showForm ? (
            <form
              onSubmit={submitNew}
              className="grid gap-3 rounded-[var(--radius-lg)] border border-line bg-panel p-4"
            >
              <TextInput
                label="Event name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.currentTarget.value }))}
                placeholder="Pet Expo Thailand"
                error={errors.name}
                maxLength={160}
                autoFocus
              />
              <TextInput
                label="Venue (optional)"
                value={form.venue}
                onChange={(e) => setForm((s) => ({ ...s, venue: e.currentTarget.value }))}
                placeholder="IMPACT, Hall 5–8"
                error={errors.venue}
                maxLength={160}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Start date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, startDate: e.currentTarget.value }))
                  }
                  error={errors.startDate}
                />
                <TextInput
                  label="End date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, endDate: e.currentTarget.value }))
                  }
                  error={errors.endDate}
                />
              </div>
              {formError && (
                <p
                  role="alert"
                  className="rounded-[var(--radius-md)] border border-[var(--color-danger-soft-fg)] bg-[var(--color-danger-soft-bg)] px-3 py-2 text-sm text-[var(--color-danger-soft-fg)]"
                >
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create event
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowForm(true)}>+ New event</Button>
          )}
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6 text-[var(--lavender-700)]" />}
          title="No events yet."
          body={
            canManage
              ? "Create an event, then allocate your active products into it to start selling."
              : "No events yet. Ask a manager to create one."
          }
        />
      ) : (
        <ul className="grid gap-2">
          {events.map((ev) => {
            const busy = busyId === ev.id && pending;
            return (
              <li
                key={ev.id}
                className="rounded-[var(--radius-lg)] border border-line bg-panel px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-extrabold text-text">{ev.name}</span>
                    <Pill tone={STATUS_TONE[ev.status] ?? "neutral"}>{ev.status}</Pill>
                  </div>
                  <span className="num text-xs text-muted">
                    {ev.start_date} → {ev.end_date}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {ev.venue ? `${ev.venue} · ` : ""}
                  <span className="num">{ev.productCount}</span> product
                  {ev.productCount === 1 ? "" : "s"} ·{" "}
                  <span className="num">{ev.totalCurrentQty}</span> units in stock
                </p>

                {(canManage || canAllocate) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {canAllocate &&
                      ev.status !== "closed" &&
                      ev.status !== "archived" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setStockOpen((id) => (id === ev.id ? null : ev.id))
                        }
                      >
                        {stockOpen === ev.id ? "Hide stock" : "Manage stock"}
                      </Button>
                    )}
                    {canAllocate && ev.status !== "closed" && ev.status !== "archived" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => allocate(ev)}
                        loading={busy}
                      >
                        Sync active products
                      </Button>
                    )}
                    {canManage && ev.status === "planned" && (
                      <Button
                        size="sm"
                        onClick={() => changeStatus(ev, "running", "Event started")}
                        loading={busy}
                      >
                        Start selling
                      </Button>
                    )}
                    {canManage && ev.status === "running" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => changeStatus(ev, "closed", "Event closed")}
                        loading={busy}
                      >
                        Close event
                      </Button>
                    )}
                    {canManage && ev.status === "closed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => changeStatus(ev, "planned", "Event reopened")}
                        loading={busy}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                )}
                {stockOpen === ev.id && (
                  <EventStockPanel eventId={ev.id} canAdjust={canAllocate} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {activeProductCount === 0 && events.length > 0 && (
        <p className="mt-4 text-xs text-[var(--color-warn-soft-fg)]">
          You have no active products yet — add some in Products, then “Sync
          active products” here.
        </p>
      )}
    </div>
  );
}
