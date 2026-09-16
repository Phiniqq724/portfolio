import { Container } from "@/components/ui/Container";
import { ServiceAccordion } from "@/components/ui/ServiceAccordion";
import { services, servicesHeading } from "@/content/site";

/**
 * Accent tone. Section title, then the four service rows. The toys (accordion
 * and the cursor-following preview) live in ServiceAccordion, the Motion leaf.
 * Server component: nothing here holds state.
 * Mobile: title, then the same rows stacked in one column; no hover preview.
 */
export function WhatIDo() {
  return (
    <section id="what-i-do" data-tone="accent" className="scroll-mt-nav py-section">
      <Container>
        <h2 className="font-display text-display uppercase">{servicesHeading}</h2>

        <div className="mt-16 md:mt-24">
          <ServiceAccordion services={services} />
        </div>
      </Container>
    </section>
  );
}
