import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Design-system handoff export (reference assets + stale duplicated source) —
    // not part of the app; keep it out of lint.
    "Mochi POS Design System-handoff/**",
  ]),
  // `react-hooks/set-state-in-effect` (new in eslint-config-next 16 / React 19)
  // fires on intentional client-mount localStorage hydration in the demo stores
  // and a few debounced "derive from props" effects — these are not bugs. Treat
  // as advisory until that layer moves to useSyncExternalStore / derive-in-render.
  // (`react-hooks/rules-of-hooks` stays an error.)
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
