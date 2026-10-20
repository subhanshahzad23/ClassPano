import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { PublicHero, PublicShell } from "@/components/site/public-shell";
import { Code, DocSection } from "@/components/site/doc";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "MV3 prototype" };

export default function ExtensionPage() {
  return (
    <PublicShell>
      <PublicHero eyebrow="Deliverable 1 · Manifest V3" title="A real extension," muted="not a picture of one.">
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-paper/85">The download below is an unpacked Chrome extension built from this demo&apos;s source. It uses the same platform modules, normalizer and dedupe code you see on the sync page, and runs against a standalone copy of the simulated portal hosted here.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/downloads/classpano-sync-extension.zip" size="lg" arrow icon={<Download className="size-4" />} download>
            Download the prototype (.zip, 16 KB)
          </ButtonLink>
          <ButtonLink href="/portal/assignment-center" size="lg" variant="ghost-dark" icon={<ExternalLink className="size-4" />} target="_blank" rel="noopener">
            Open the test portal
          </ButtonLink>
        </div>
      </PublicHero>

      <DocSection id="install" eyebrow="Two minutes" title="Install and try it." tone="paper">
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Download and unzip", "You'll get a folder called classpano-sync."],
            ["Open chrome://extensions", "Switch on Developer mode (top right)."],
            ["Load unpacked", "Choose the classpano-sync folder. Pin ClassPano Sync from the puzzle-piece menu."],
            ["Open the test portal", "Visit /portal/assignment-center on this site. It's the same fictional Westbrook portal."],
            ["Click the icon, allow, sync", "Try every portal tab, then add ?v=B to the address to see teacher updates, and sync again."],
            ["Bring it into the dashboard", "Export JSON from the popup, then use Import on the dashboard's Your data page. Re-importing never duplicates."],
          ].map(([t, b], i) => (
            <li key={t} className="rounded-[20px] bg-fog p-5">
              <p className="font-display text-[34px] leading-none tracking-[-0.04em] text-muted-display">{i + 1}</p>
              <p className="mt-3 text-[16px] font-semibold">{t}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{b}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[14px] text-muted">On any other site the prototype finds no platform module and offers AI-assisted capture with a review step. In the prototype a local extractor stands in for the LLM.</p>
      </DocSection>

      <DocSection id="inside" eyebrow="What's inside" title="Small on purpose." muted="Every file earns its place." tone="fog">
        <div className="grid gap-6 lg:grid-cols-2">
          <Code title="classpano-sync/">{`manifest.json   MV3 · activeTab, scripting, storage only
popup.html      consent, sync, results, AI review
popup.js        normalize + merge (shared core), chrome.storage
content.js      module registry, injected on click only
icons/          16 · 32 · 48 · 128

Built by scripts/build-extension.mjs (esbuild) from:
  extension/src/popup.ts
  extension/src/content.ts
  src/core/**   ← same code as the web demo`}</Code>
          <div className="space-y-3 text-[15.5px] leading-relaxed">
            <p>
              <b>Real in the prototype:</b> MV3 manifest with least-privilege permissions, consent on first use, on-click injection, platform detection, the Blackbaud module reading the page, normalization, identity and fingerprint dedupe, change logging, AI-capture fallback with review, JSON export, and clear-data.
            </p>
            <p>
              <b>Comes in Milestones 2–3:</b> the side-panel UI, sign-in to a ClassPano account, upload to the sync API instead of local storage, Blackbaud selectors locked against your test account, and automated fixture tests.
            </p>
            <p className="text-muted">The extension contains no remote code and makes no network requests of its own. In production, sync uploads go only to the ClassPano API.</p>
          </div>
        </div>
      </DocSection>
    </PublicShell>
  );
}
