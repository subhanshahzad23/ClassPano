"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileJson, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { SCHEMA_VERSION } from "@/core/schema";
import { deleteAllData, deleteRecord, exportPayload, importPayload } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/display";
import { ConfirmDialog, Segmented } from "@/components/ui/overlay";
import { JsonBlock } from "@/components/sync/sync-panel";
import { CourseDot, NoData, useDash } from "@/components/dashboard/common";
import { trackMilestone } from "@/components/demo/visit-tracker";

export default function DataPage() {
  const { items, grades, syncs } = useDash();
  const [sel, setSel] = useState<string | null>(null);
  const [kind, setKind] = useState<"items" | "grades">("items");
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const changeEvents = useMemo(() => items.reduce((m, i) => m + i.history.length, 0) + grades.reduce((m, g) => m + g.history.length, 0), [items, grades]);
  const list = kind === "items" ? [...items].sort((a, b) => a.courseName.localeCompare(b.courseName) || a.title.localeCompare(b.title)) : grades;
  const selected = (kind === "items" ? items.find((i) => i.id === sel) : grades.find((g) => g.id === sel)) ?? list[0];

  const download = () => {
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "classpano-export.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    trackMilestone("Exported data as JSON");
  };

  const onImport = async (f: File) => {
    try {
      const run = importPayload(JSON.parse(await f.text()));
      toast.success(`Imported: ${run.counts.created} new, ${run.counts.updated} updated, ${run.counts.unchanged + run.counts.duplicatesPrevented} already here.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That file isn't a ClassPano export.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={SCHEMA_VERSION}
        title="Your data"
        description="Everything ClassPano stores for Ava, in the platform-neutral format. Inspect any record, export it all, or delete it. Deletion here is real, not hidden."
        actions={
          <>
            <Button variant="outline" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
              Import extension export
            </Button>
            <Button variant="dark" icon={<Download className="size-4" />} onClick={download} disabled={!items.length && !grades.length}>
              Export JSON
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </>
        }
      />

      {!items.length && !grades.length ? (
        <NoData />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Academic records", items.length],
              ["Grade records", grades.length],
              ["Logged field changes", changeEvents],
              ["Syncs", syncs.length],
            ].map(([l, v]) => (
              <div key={l} className="rounded-[16px] bg-paper p-5">
                <p className="text-[13.5px] text-muted">{l}</p>
                <p className="mt-1 font-display text-[40px] leading-none tracking-[-0.04em] tabular">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel className="p-0 sm:p-0">
              <div className="flex items-center justify-between gap-2 px-5 pt-5">
                <Segmented
                  label="Record type"
                  value={kind}
                  onChange={(v) => {
                    setKind(v);
                    setSel(null);
                  }}
                  options={[
                    { value: "items", label: `Items (${items.length})` },
                    { value: "grades", label: `Grades (${grades.length})` },
                  ]}
                />
              </div>
              <ul className="mt-3 max-h-[560px] overflow-y-auto px-2 pb-3">
                {list.map((r) => {
                  const active = selected?.id === r.id;
                  const verified = "verified" in r ? r.verified : true;
                  return (
                    <li key={r.id}>
                      <button type="button" onClick={() => setSel(r.id)} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left", active ? "bg-fog" : "hover:bg-fog/60")}>
                        <CourseDot courseKey={r.courseKey} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{"title" in r ? r.title : `${r.courseName} grade`}</span>
                          <span className="block truncate font-mono text-[11px] text-muted">{r.id}</span>
                        </span>
                        {verified ? <ShieldCheck className="size-4 shrink-0 text-leaf-ink" aria-label="Verified" /> : <Sparkles className="size-4 shrink-0 text-[#6b21a8]" aria-label="AI-extracted" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <div className="min-w-0 space-y-3">
              {selected && <JsonBlock title={`${selected.id} · ${SCHEMA_VERSION}`} value={selected} />}
              {selected && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Trash2 className="size-4" />}
                  onClick={() => {
                    deleteRecord(selected.id);
                    setSel(null);
                    toast.success("Record deleted. The next sync will bring it back only if it is still on the portal.");
                  }}
                >
                  Delete this record
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader title="Field reference" description="What every record carries, whatever platform it came from" />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
                {[
                  ["identityKey", "Platform id when available, else course + title"],
                  ["fingerprint", "Hash of mutable fields; equal means unchanged"],
                  ["verified", "true = school platform, false = AI, user-confirmed"],
                  ["source", "Platform, module version, page, external id, time"],
                  ["history[]", "Every field change with sync id and time"],
                  ["aliases[] / notes[]", "Same item seen elsewhere, merged not duplicated"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[12px] text-leaf-ink">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel>
              <PanelHeader title="Delete everything" description="Records, grades, change history and sync logs" />
              <p className="text-[14px] leading-relaxed text-ink">In production this deletes server-side data and backups on a fixed schedule, revokes the extension&apos;s link to the account, and confirms by email to the parent. Here it clears this browser.</p>
              <Button variant="danger" className="mt-4" icon={<Trash2 className="size-4" />} onClick={() => setConfirm(true)}>
                Delete all of Ava&apos;s data
              </Button>
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
                <FileJson className="size-3.5" /> Export first if you want a copy.
              </p>
            </Panel>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete all of Ava's data?"
        description="Every synced record, grade, change log and sync history in this browser will be removed. This can't be undone."
        confirmLabel="Delete everything"
        confirmVariant="danger"
        onConfirm={() => {
          deleteAllData();
          trackMilestone("Tried delete-all");
          toast.success("All data deleted.");
        }}
      />
    </>
  );
}
