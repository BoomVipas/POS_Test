"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useDemoClaims } from "@/lib/demo/useDemoClaims";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/TextInput";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/provider";
import { formatTHB } from "@/lib/money/format";
import type { CartLine, Product } from "@/lib/pos/types";

type ClaimResult = {
  code: string;
  customerName: string;
  totalSatang: number;
};

export function CustomerView() {
  const { items: catalog, ready } = useDemoCatalog();
  const claims = useDemoClaims();
  const { push } = useToast();
  const { t } = useT();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitted, setSubmitted] = useState<ClaimResult | null>(null);

  const productIndex = useMemo(
    () => new Map(catalog.map((p) => [p.id, p])),
    [catalog],
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const p = productIndex.get(l.productId);
        return p ? sum + p.price_satang * l.qty : sum;
      }, 0),
    [lines, productIndex],
  );

  function addLine(p: Product) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { productId: p.id, qty: 1, fulfillment: "take_now" }];
    });
  }

  function adjustQty(productId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, qty: Math.max(0, l.qty + delta) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function submit() {
    if (lines.length === 0) {
      push({
        kind: "warn",
        title: t.qrMenu.cartEmpty,
        message: t.qrMenu.addSomething,
      });
      return;
    }
    if (name.trim().length < 2) {
      push({
        kind: "warn",
        title: t.qrMenu.nameRequired,
        message: t.qrMenu.nameRequiredHint,
      });
      return;
    }
    setSubmitting(true);
    const claim = claims.create({ lines, customerName: name.trim() });
    setSubmitted({
      code: claim.code,
      customerName: claim.customerName,
      totalSatang: subtotal,
    });
    setLines([]);
    setName("");
    setShowSubmit(false);
    setSubmitting(false);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-md px-4 py-8 text-center text-sm text-muted">
        {t.common.loading}
      </main>
    );
  }

  if (catalog.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="font-display text-2xl text-accent-strong">
          {t.qrMenu.noCatalogTitle}
        </h1>
        <p className="mt-2 text-sm text-muted">{t.qrMenu.noCatalogBody}</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="panel p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            {t.qrMenu.claimReady}
          </p>
          <p className="mt-2 font-display text-5xl tracking-[0.3em] text-accent-strong">
            {submitted.code}
          </p>
          <p className="mt-3 text-sm text-text/85">
            {t.qrMenu.showAtBooth(submitted.customerName)}
          </p>
          <p className="num mt-1 text-xs text-muted">
            {t.pos.total}: {formatTHB(submitted.totalSatang)} THB
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={() => setSubmitted(null)}>
              {t.qrMenu.startOver}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const activeCatalog = catalog
    .filter((p) => p.is_active)
    .sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return a.name.localeCompare(b.name);
    });

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-32">
      <h1 className="font-display text-2xl text-accent-strong">
        {t.qrMenu.title}
      </h1>
      <p className="mt-1 text-sm text-muted">{t.qrMenu.body}</p>

      <ul className="mt-5 grid gap-2">
        {activeCatalog.map((p) => {
          const line = lines.find((l) => l.productId === p.id);
          const qty = line?.qty ?? 0;
          const remaining = Math.max(0, p.current_qty - qty);
          const soldout = remaining <= 0 && qty === 0;
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-muted">{p.sku}</p>
                <p className="line-clamp-2 text-sm font-extrabold text-text">
                  {p.name}
                </p>
                <p className="num text-xs text-muted">
                  {formatTHB(p.price_satang)} THB
                  {soldout && ` · ${t.pos.soldOut}`}
                </p>
              </div>
              {qty > 0 ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustQty(p.id, -1)}
                    aria-label="Decrease"
                    className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-fg)]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="num min-w-[1.5rem] text-center text-sm font-black">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustQty(p.id, 1)}
                    aria-label="Increase"
                    disabled={remaining === 0}
                    className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)] disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addLine(p)}
                  disabled={soldout}
                >
                  +
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-panel/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
            <ShoppingCart size={18} className="text-accent-strong" />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t.pos.total}
              </p>
              <p className="num text-lg font-black text-accent-strong">
                {formatTHB(subtotal)} THB
              </p>
            </div>
            <Button onClick={() => setShowSubmit(true)}>
              {t.qrMenu.submitOrder}
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        title={t.qrMenu.submitTitle}
        size="sm"
      >
        <p className="text-sm text-text/85">{t.qrMenu.submitBody}</p>
        <div className="mt-3">
          <TextInput
            label={t.qrMenu.fName}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            autoComplete="name"
            placeholder={t.qrMenu.fNamePlaceholder}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowSubmit(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={submit} loading={submitting}>
            {t.qrMenu.generateCode}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
