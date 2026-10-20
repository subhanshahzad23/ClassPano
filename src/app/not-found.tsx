import { PublicShell } from "@/components/site/public-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PublicShell footer={false}>
      <section data-hero className="dots-dark on-dark -mt-[80px] min-h-dvh pt-[200px] text-paper sm:-mt-[88px]">
        <div className="container-page">
          <p className="eyebrow text-muted-display">404</p>
          <h1 className="display-xl mt-4 max-w-[18ch]">
            <span className="text-muted-display">This page isn&apos;t synced.</span> Let&apos;s get you back.
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/" size="lg" arrow>
              Back to the pitch
            </ButtonLink>
            <ButtonLink href="/demo" size="lg" variant="ghost-dark">
              All demo pages
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
