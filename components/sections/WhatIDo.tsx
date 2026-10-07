import { Container } from "@/components/ui/Container";
import { ServiceAccordion } from "@/components/ui/ServiceAccordion";
import { services, servicesHeading } from "@/content/site";

/**
 * Light tone. Lime is no longer the whole section: it survives only as the
 * highlighter mark behind the open row's title, so the accent marks the
 * active row instead of filling the screen. Section title, then the four
 * service rows, kept compact (96px closed rows at md+). The toy lives in
 * ServiceAccordion, the Motion leaf: hover (or keyboard focus, or a tap)
 * opens a row, and at md+ its image unrolls on the right inside the row.
 * Server component: nothing here holds state.
 * Mobile: title, then the same rows stacked in one column; tap to open, no
 * image.
 */
export function WhatIDo() {
  return (
    <section id="what-i-do" data-tone="light" className="py-section">
      <Container>
        <h2 className="font-display text-display uppercase">{servicesHeading}</h2>

        <div className="mt-12 md:mt-16">
          <ServiceAccordion services={services} />
        </div>
      </Container>
    </section>
  );
}
