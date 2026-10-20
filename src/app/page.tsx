import { PublicShell } from "@/components/site/public-shell";
import { Hero } from "@/components/site/home/hero";
import { Closing, Deliverables, How, Modules, Privacy, Problem, Proofs } from "@/components/site/home/sections";

export default function Home() {
  return (
    <PublicShell>
      <Hero />
      <Problem />
      <How />
      <Proofs />
      <Modules />
      <Privacy />
      <Deliverables />
      <Closing />
    </PublicShell>
  );
}
