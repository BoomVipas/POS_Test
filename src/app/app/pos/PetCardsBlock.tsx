"use client";

import { useState } from "react";
import {
  petSummary,
  speciesEmoji,
  type DemoPet,
  type PetSpecies,
} from "@/lib/demo/pets";
import { useDemoPets } from "@/lib/demo/useDemoPets";
import { useDemoAudit } from "@/lib/demo/useDemoAudit";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const SPECIES_OPTIONS: PetSpecies[] = [
  "cat",
  "dog",
  "rabbit",
  "bird",
  "other",
];

/** Inline pet roster for one customer phone. Renders inside the POS
 *  customer block (only when a phone is entered). Pattern stolen from
 *  Pet Lovers Centre + Thai cat-cafe POS conventions. */
export function PetCardsBlock({ phone }: { phone: string }) {
  const pets = useDemoPets();
  const audit = useDemoAudit();
  const trimmed = phone.trim();
  const list = trimmed ? pets.forPhone(trimmed) : [];
  const [adding, setAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<DemoPet | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftSpecies, setDraftSpecies] = useState<PetSpecies>("cat");
  const [draftBreed, setDraftBreed] = useState("");
  const [draftWeight, setDraftWeight] = useState("");

  if (!trimmed) return null;
  if (!pets.ready) return null;

  function handleAdd() {
    if (draftName.trim().length < 1) return;
    const weight = draftWeight.trim() === "" ? undefined : Number(draftWeight);
    const pet = pets.add(trimmed, {
      name: draftName.trim(),
      species: draftSpecies,
      ...(draftBreed.trim() ? { breed: draftBreed.trim() } : {}),
      ...(weight !== undefined && Number.isFinite(weight) && weight > 0
        ? { weightKg: weight }
        : {}),
    });
    if (pet) {
      audit.log({
        action: "pet_create",
        targetTable: "pets",
        targetId: pet.id,
        summary: `+ ${pet.name} (${pet.species}) for ${trimmed}`,
        newValue: { name: pet.name, species: pet.species, breed: pet.breed },
      });
    }
    setDraftName("");
    setDraftSpecies("cat");
    setDraftBreed("");
    setDraftWeight("");
    setAdding(false);
  }

  function handleRemove(p: DemoPet) {
    setPendingRemove(p);
  }

  function confirmRemove() {
    const p = pendingRemove;
    if (!p) return;
    pets.remove(p.id);
    audit.log({
      action: "pet_delete",
      targetTable: "pets",
      targetId: p.id,
      summary: `− ${p.name} (${p.species})`,
      oldValue: { name: p.name, species: p.species },
    });
    setPendingRemove(null);
  }

  if (list.length === 0 && !adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="self-start rounded-full border border-dashed border-line bg-panel px-3 py-1 text-[11px] font-bold text-muted hover:text-accent-strong"
      >
        + Add cat / pet for this customer
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
        Pets on file
      </p>
      <ul className="mt-2 grid gap-1.5">
        {list.map((p) => (
          <li
            key={p.id}
            className="flex items-baseline justify-between gap-2 rounded-lg bg-soft px-2 py-1.5 text-xs"
          >
            <span>
              <span className="mr-1">{speciesEmoji(p.species)}</span>
              <strong className="font-extrabold text-text">
                {petSummary(p)}
              </strong>
              {p.allergies && (
                <span className="ml-2 rounded-full bg-[var(--color-warn-soft-bg)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--color-warn-soft-fg)]">
                  ⚠ {p.allergies}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(p)}
              className="text-[10px] font-bold text-[var(--color-danger-soft-fg)] hover:underline"
              aria-label={`Remove ${p.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="mt-2 grid gap-2">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Name (e.g. Mochi)"
              value={draftName}
              onChange={(e) => setDraftName(e.currentTarget.value)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              autoFocus
            />
            <select
              value={draftSpecies}
              onChange={(e) =>
                setDraftSpecies(e.currentTarget.value as PetSpecies)
              }
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            >
              {SPECIES_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {speciesEmoji(s)} {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Breed (optional)"
              value={draftBreed}
              onChange={(e) => setDraftBreed(e.currentTarget.value)}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
            <input
              type="number"
              placeholder="Weight kg (optional)"
              value={draftWeight}
              onChange={(e) => setDraftWeight(e.currentTarget.value)}
              min={0}
              step={0.1}
              className="rounded-md border border-line bg-white px-2 py-1.5 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full bg-panel px-3 py-1 text-[11px] font-bold text-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={draftName.trim().length === 0}
              className="rounded-full bg-[#2a2557] px-3 py-1 text-[11px] font-extrabold text-white disabled:opacity-50"
            >
              Save pet
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 self-start text-[11px] font-bold text-accent-strong"
        >
          + Add another
        </button>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        destructive
        title={pendingRemove ? `Remove ${pendingRemove.name}?` : "Remove pet?"}
        body="This removes the pet from this customer's profile in demo mode."
        confirmLabel="Remove pet"
        cancelLabel="Keep it"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
