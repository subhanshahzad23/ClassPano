# ClassPano Sync: Phase 1 proof of concept

An interactive proof of concept for **ClassPano**. It's a Manifest V3 Chrome extension that captures assignments, due dates, classes, grades and announcements from a Blackbaud-style school portal, syncs again without duplicates, and stores everything in one platform-neutral format (`cp.academic.v1`). It also includes the student/parent dashboard, AI-assisted capture for unsupported sites, the architecture write-up and the proposal.

Built in **Next.js** (App Router). Only the visit-tracking email route runs on a server.

> **Demo · fictional data.** Westbrook Academy, Ava Thompson and Laura Thompson are invented. The portal recreates a Blackbaud-style layout with generic branding. Synced records stay in the viewer's browser.

## Run it

You need Node 20 or later.

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

For a production build (this also rebuilds the extension zip):

```bash
npm run build && npm run start
```

- The guided walkthrough starts from **Walkthrough** in the nav, or from the dark **Demo · fictional data** pill in the bottom-left corner.
- The pill also opens presenter controls:
  - Student or parent view.
  - The portal's "first sync" or "after teacher updates" content.
  - Load a completed sync.
  - Reset.

## What's in it

| Route | What it shows |
|---|---|
| `/` | The pitch: problem, how Sync works, the three Milestone-1 proofs, the modular approach, privacy, deliverables |
| `/sync` | A simulated Chrome window with the school portal and the extension's side panel. The real adapter parses the page's HTML. |
| `/sync?tab=capture` | AI-assisted capture on a teacher's own website, with a review step before saving |
| `/dashboard/*` | Overview, assignments, grades, calendar, AI briefing, sources and sync log, data inspector (export and delete) |
| `/architecture` | System, platform modules, sync flow, dedupe, AI capture, schema, security, limitations, stack, next steps |
| `/proposal` | Answers to the seven questions, Phase 1 milestones and price, optional features, Phases 2–4 |
| `/extension` | Download and install the real MV3 prototype |
| `/portal/[page]` | The standalone test portal the real extension runs on (`?v=B` = after teacher updates) |
| `/demo` | Index of everything |

**The proofs, reproducible:**

| Sync | New | Updated | Unchanged | Duplicates prevented |
|---|---|---|---|---|
| Assignment Center (first sync) | 18 | | | |
| Schedule | 2 | | | 16 |
| Assignment Center, after teacher updates | 1 | 4 | 14 | 0 created |

Run `npm run check:core` to replay the whole pipeline headlessly.

## How it's built

- **`src/core/`** is shared by the web demo and the extension:
  - `schema.ts`: the `cp.academic.v1` format.
  - `adapters/`: the platform-module interface, the Blackbaud module, the Canvas preview and the registry.
  - `normalize.ts`, `merge.ts` (identity key → fingerprint → fuzzy match, with a field-level change log) and `hash.ts`.
  - `ai-capture.ts`: a deterministic stand-in for the LLM, using the same JSON shape.
  - `insights.ts`: the briefings.
- **`src/core/portal/`**: fixture data and the HTML renderer for the simulated portal.
- **`src/lib/store.ts`**: a Zustand store persisted to `localStorage`.
- **`src/content/proposal.ts`**: every price, milestone and phase. Edit it here.
- **`extension/`**: the MV3 prototype (manifest, popup, content script). `npm run build:extension` bundles it with esbuild, draws the icons and writes `public/downloads/classpano-sync-extension.zip`.
- **Theme**:
  - Newsreader and DM Sans.
  - A black dotted hero, one jade accent and flat surfaces.
  - Tokens live in `src/app/globals.css`, and the shared UI in `src/components/ui/`.

## Visit tracking (email when the client opens the demo)

`src/components/demo/visit-tracker.tsx` posts to `src/app/api/track/route.ts`, which sends mail through **Titan SMTP**:

- **One "demo opened" email per browser session.** It includes the time, the city and country (from Vercel geo headers), the device, the referrer, the landing page, and whether this is a first or return visit.
- **A short session summary when the tab is hidden.** It lists the pages viewed, time on each, and actions taken (for example "Synced Assignment Center after teacher updates" or "Opened the proposal and pricing"). At most 3 summaries are sent per session.
- **Bots and link previewers are ignored.** This covers Slack, LinkedIn, WhatsApp and similar crawlers.
- **Your own visits can be excluded.** Open the demo once with **`?notrack=1`** on your own browser to stop emails for your visits, and use `?notrack=0` to undo it.

Setup:

1. Copy `.env.example` to `.env.local` (already created locally) and fill in `TITAN_SMTP_USER`, `TITAN_SMTP_PASS` and `TRACK_EMAIL_TO`.
2. On Vercel, add the same keys under **Settings → Environment Variables**, set `NEXT_PUBLIC_SITE_URL` to the deployed URL, and redeploy.

If the SMTP keys are missing, the route skips sending and logs a warning. The site keeps working.

## Checks

```bash
npx tsc --noEmit -p .
npx eslint src extension/src scripts
npm run check:core
```
