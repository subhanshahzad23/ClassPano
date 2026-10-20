import { blackbaudAdapter } from "./blackbaud";
import { canvasAdapter } from "./canvas";
import type { PageContext, PlatformAdapter } from "./types";

/** Every platform module the extension ships with. Order = match priority. */
export const ADAPTERS: PlatformAdapter[] = [blackbaudAdapter, canvasAdapter];

/** Platforms on the roadmap, shown in the dashboard's Sources page. */
export const PLANNED_PLATFORMS = [
  { id: "schoology", name: "Schoology", note: "Adapter module (Phase 4)" },
  { id: "google_classroom", name: "Google Classroom", note: "Official API with OAuth — no page reading needed" },
  { id: "facts", name: "FACTS SIS", note: "Adapter module (Phase 4)" },
] as const;

/** Picks the adapter for the current page, or null → offer AI-assisted capture. */
export function pickAdapter(ctx: PageContext): PlatformAdapter | null {
  return ADAPTERS.find((a) => a.matches(ctx)) ?? null;
}
