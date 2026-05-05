"use client";

import { useEffect, useState } from "react";
import { useDemoSettings } from "@/lib/demo/useDemoSettings";
import { isValidPhoneTH, normalizePhoneTH } from "@/lib/phone";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function SettingsForm() {
  const { settings, save, ready } = useDemoSettings();
  const [brand, setBrand] = useState(settings.brandDisplayName);
  const [phone, setPhone] = useState(settings.promptpayPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { push } = useToast();

  // SSR returns DEFAULT_DEMO_SETTINGS (no window). Once the localStorage values
  // are read post-hydration, sync them into the form once.
  useEffect(() => {
    if (!ready) return;
    setBrand(settings.brandDisplayName);
    setPhone(settings.promptpayPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneError(null);
    if (!isValidPhoneTH(phone)) {
      setPhoneError("Doesn't look like a valid Thai phone");
      return;
    }
    const normalized = normalizePhoneTH(phone, "local");
    save({
      brandDisplayName: brand.trim() || "Demo Brand",
      promptpayPhone: normalized,
    });
    setPhone(normalized);
    push({
      kind: "success",
      title: "Saved",
      message: "Settings updated. POS will use these on the next sale.",
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <TextInput
        label="Brand display name"
        value={brand}
        onChange={(e) => setBrand(e.currentTarget.value)}
        hint="Shown in the top bar."
        autoComplete="organization"
        maxLength={120}
      />
      <TextInput
        label="PromptPay phone"
        value={phone}
        onChange={(e) => setPhone(e.currentTarget.value)}
        error={phoneError ?? undefined}
        hint="The QR generated at checkout uses this number."
        placeholder="08x-xxx-xxxx"
        autoComplete="tel"
        inputMode="tel"
        maxLength={20}
      />
      <div className="mt-2 flex gap-3">
        <Button type="submit">Save</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setBrand(settings.brandDisplayName);
            setPhone(settings.promptpayPhone);
            setPhoneError(null);
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
