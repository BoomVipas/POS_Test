"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { portalUrlFor } from "@/lib/demo/customer-tokens";
import {
  issueRegistrationToken,
  type IssueRegistrationTokenResult,
} from "./actions";

export type ReceiptRegistrationToken = {
  token: string;
  claimedAt: string | null;
  expiresAt: string;
};

export function RealRegistrationLinkBlock({
  orderId,
  initialToken,
}: {
  orderId: string;
  initialToken: ReceiptRegistrationToken | null;
}) {
  const [origin, setOrigin] = useState("");
  const [token, setToken] = useState(initialToken);
  const [issuing, setIssuing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const url = useMemo(() => {
    if (!origin || !token) return "";
    return portalUrlFor(token.token, origin);
  }, [origin, token]);

  useEffect(() => {
    let cancelled = false;
    async function renderQr() {
      if (!url) {
        setQrSvg("");
        return;
      }
      try {
        const svg = await QRCode.toString(url, {
          type: "svg",
          width: 220,
          margin: 1,
          color: { dark: "#1c1838", light: "#f7f5fb" },
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrSvg(svg);
      } catch {
        if (!cancelled) setQrSvg("");
      }
    }
    void renderQr();
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function handleIssue() {
    setIssuing(true);
    setError(null);
    try {
      const result: IssueRegistrationTokenResult =
        await issueRegistrationToken(orderId);
      if (result.ok) {
        setToken({
          token: result.token,
          claimedAt: null,
          expiresAt: "",
        });
      } else {
        setError(result.error);
      }
    } finally {
      setIssuing(false);
    }
  }

  function copyLink() {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setError("Copy was blocked by the browser. Select the link manually.");
      },
    );
  }

  if (token?.claimedAt) {
    return (
      <div className="no-print mt-6 rounded-xl border border-line bg-[var(--color-ok-soft-bg)] px-4 py-3 text-[var(--color-ok-soft-fg)]">
        <p className="text-sm font-extrabold">
          Customer registered after this sale
        </p>
        <p className="mt-1 text-xs">
          The token has been claimed and linked to this order.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="no-print mt-6 rounded-xl border border-line bg-soft px-4 py-4">
        <p className="text-sm font-bold text-accent-strong">
          Build customer relationship
        </p>
        <p className="mt-1 text-xs text-muted">
          Issue a one-shot link the customer can scan to save contact and pet
          info after checkout. Optional; the sale is already saved.
        </p>
        <button
          type="button"
          onClick={handleIssue}
          disabled={issuing}
          className="mt-3 rounded-[var(--radius-md)] border border-line bg-panel px-4 py-2 text-sm font-bold text-accent-strong hover:bg-soft disabled:opacity-60"
        >
          {issuing ? "Creating..." : "Send registration link"}
        </button>
        {error && (
          <p className="mt-2 text-xs font-bold text-[var(--color-danger-soft-fg)]">
            {error}
          </p>
        )}
      </div>
    );
  }

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
            className="grid h-[220px] w-[220px] place-items-center rounded-xl bg-[#f7f5fb] p-2"
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
              {copied ? "Copied" : "Copy link"}
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
            Token: <span className="num font-bold">{token.token}</span>
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs font-bold text-[var(--color-danger-soft-fg)]">
          {error}
        </p>
      )}
    </div>
  );
}
