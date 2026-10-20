"use client";

import { useEffect } from "react";
import { trackMilestone } from "@/components/demo/visit-tracker";

/** Notes in the session summary that the visitor reached the pricing page. */
export function ProposalTracker() {
  useEffect(() => trackMilestone("Opened the proposal and pricing"), []);
  return null;
}
