"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useDemoCustomerTokens } from "@/lib/demo/useDemoCustomerTokens";
import { portalUrlFor, type DemoCustomerToken } from "@/lib/demo/customer-tokens";

/**
 * Receipt success-screen widget (Wave 40b — demo mode).
 *
 * "Send registration link" button issues a one-shot token tied to the order
 * and shows a QR + shareable URL. Customer scans / opens, lands on
 * /register/[token], registers their profile + optional pet AFTER the sale.
 *
 * Design rule, VISION.md: this widget never blocks Save. It appears AFTER
 * the sale is recorded. Cashier can ignore it and move to the next sale.
 */
export function RegistrationLinkBlock({ orderId }: { orderId: string }) {
  const { ready, forOrder, registeredForOrder, create } = useDemoCustomerTokens();
  const [origin, setOrigin] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  if (!ready) return null;

  const existing = forOrder(orderId);
  // Pick the most recent unclaimed token for this order; otherwise the latest.
  const active =
    existing.find((t) => !t.claimedAt) ??
    [...existing].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0] ??
    null;
  const registered = registeredForOrder(orderId);

  function handleIssue() {
    const row = create(orderId);
    void renderQr(row, origin);
  }

  async function renderQr(row: DemoCustomerToken, originVal: string) {
    if (!originVal) return;
    try {
      const url = portalUrlFor(row.token, originVal);
      const svg = await QRCode.toString(url, {
        type: "svg",
        width: 220,
        margin: 1,
        color: { dark: "#3a2509", light: "#fdf7ec" },
        errorCorrectionLevel: "M",
      });
      setQrSvg(svg);
    } catch {
      setQrSvg("");
    }
  }

  useEffect(() => {
    if (active && origin) void renderQr(active, origin);
  }, [active, origin]);

  function copyLink() {
    if (!active || !origin) return;
    const url = portalUrlFor(active.token, origin);
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // ignore — clipboard may be blocked
      },
    );
  }

  // After successful claim — show a quiet confirmation instead of the QR.
  if (registered.length > 0) {
    return (
      <div className="no-print mt-6 rounded-xl border border-line bg-[var(--color-ok-soft-bg)] px-4 py-3 text-[var(--color-ok-soft-fg)]">
        <p className="text-sm font-extrabold">
          ✓ Customer registered after this sale
        </p>
        <p className="mt-1 text-xs">
          {registered[0].displayName ?? "Customer"} —{" "}
          {registered[0].pets.length > 0
            ? `${registered[0].pets.length} pet${
                registered[0].pets.length === 1 ? "" : "s"
              }`
            : "no pet info"}
        </p>
      </div>
    );
  }

  // No token issued yet — single button.
  if (!active) {
    return (
      <div className="no-print mt-6 rounded-xl border border-line bg-soft px-4 py-4">
        <p className="text-sm font-bold text-accent-strong">
          Build customer relationship
        </p>
        <p className="mt-1 text-xs text-muted">
          Issue a one-shot link the customer can scan to register their profile
          and pet info AFTER this sale. Optional — checkout is already saved.
        </p>
        <button
          type="button"
          onClick={handleIssue}
          className="mt-3 rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2 text-sm font-bold text-accent-strong hover:bg-soft"
        >
          Send registration link
        </button>
      </div>
    );
  }

  // Token issued — show QR + share link + copy button.
  const url = origin ? portalUrlFor(active.token, origin) : "";
  return (
    <div className="no-print mt-6 rounded-xl border border-line bg-soft px-4 py-4">
      <p className="text-sm font-extrabold text-accent-strong">
        Customer registration link
      </p>
      <p className="mt-1 text-xs text-muted">
        Scan or share. Single use, expires in 90 days.
      </p>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        {qrSvg && (
          <div
            aria-hidden
            className="grid h-[220px] w-[220px] place-items-center rounded-xl bg-[#fdf7ec] p-2"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        )}
        <div className="flex min-w-[220px] flex-1 flex-col gap-2">
          <label className="text-xs font-bold text-muted">Share link</label>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="num w-full rounded-[var(--radius-md)] border border-line bg-white px-3 py-2 text-xs text-text"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--radius-md)] border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent-strong hover:bg-soft"
            >
              Open
            </a>
          </div>
          <p className="text-[11px] text-muted">
            Token: <span className="num font-bold">{active.token}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
