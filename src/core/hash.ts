/*
 * Small, dependency-free hashing. FNV-1a run twice with different offsets
 * gives a 64-bit hex digest: plenty for change detection on a few thousand
 * records per student, and identical in the browser, the extension and Node.
 */

function fnv1a(s: string, seed: number) {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hash64(s: string) {
  return fnv1a(s, 2166136261).toString(16).padStart(8, "0") + fnv1a(s, 0x811c9dc5 ^ 0x5bd1e995).toString(16).padStart(8, "0");
}

/** Canonical JSON: sorted keys, undefined dropped, so field order never changes the hash. */
export function canonical(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
    .join(",")}}`;
}

export function fingerprint(fields: Record<string, unknown>) {
  return hash64(canonical(fields));
}

export function stableId(prefix: string, identityKey: string) {
  return `${prefix}_${hash64(identityKey).slice(0, 12)}`;
}
