"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLangAction } from "@/lib/i18n/actions";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

const LABELS = {
  en: "EN",
  th: "ไทย",
} as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  function pick(next: "en" | "th") {
    if (next === lang || pending) return;
    start(async () => {
      await setLangAction(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center overflow-hidden rounded-full border border-line bg-panel text-xs font-extrabold",
        pending && "opacity-60",
        className,
      )}
    >
      {(["en", "th"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-pressed={lang === l}
          className={cn(
            "px-2.5 py-1.5 transition",
            lang === l
              ? "bg-gradient-to-b from-[#3d3686] to-[#2a2557] text-white"
              : "text-accent-strong hover:bg-soft",
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
