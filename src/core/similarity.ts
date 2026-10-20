import { normalizeTitle } from "./normalize";

const STOP = new Set(["the", "a", "an", "and", "of", "on", "in", "for", "to", "with", "due", "complete", "finish", "your"]);

export function tokens(title: string) {
  return normalizeTitle(title)
    .replace(/[.-]/g, " ")
    .split(" ")
    .filter((t) => t && !STOP.has(t));
}

/** Dice coefficient over title tokens: 1 = same words, 0 = nothing in common. */
export function titleSimilarity(a: string, b: string) {
  const A = tokens(a);
  const B = new Set(tokens(b));
  if (!A.length || !B.size) return 0;
  const setA = new Set(A);
  let shared = 0;
  setA.forEach((t) => B.has(t) && shared++);
  return (2 * shared) / (setA.size + B.size);
}
