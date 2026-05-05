// Demo workspace settings, persisted to localStorage.
// IMPORTANT: This is a stand-in for real Supabase workspace settings (DD-100ish).
// Once real workspace settings exist, this whole file is replaced — never reach
// into localStorage for business data.

export type DemoSettings = {
  brandDisplayName: string;
  promptpayPhone: string; // Thai phone, accepts any input format the normalizer handles
};

export const DEMO_SETTINGS_KEY = "pos-for-sell:demo-settings:v1";

export const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  brandDisplayName: "Demo Brand",
  promptpayPhone: "0812345678",
};

export function readDemoSettings(): DemoSettings {
  if (typeof window === "undefined") return DEFAULT_DEMO_SETTINGS;
  try {
    const raw = window.localStorage.getItem(DEMO_SETTINGS_KEY);
    if (!raw) return DEFAULT_DEMO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DemoSettings>;
    return { ...DEFAULT_DEMO_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_DEMO_SETTINGS;
  }
}

export function writeDemoSettings(s: DemoSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // quota or disabled storage — silently no-op
  }
}
