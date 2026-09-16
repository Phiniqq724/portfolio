import { Container } from "@/components/ui/Container";
import { FooterHeadline } from "@/components/ui/FooterHeadline";
import { Reveal } from "@/components/ui/Reveal";
import { footer, site } from "@/content/site";

/*
  Dark footer, id="contact", the target of the nav's "Let's Talk". Motion
  only: the three blocks enter with the shared Reveal primitive. Two toys:
  pressing the headline rolls LET'S TALK. into LET'S LARP. (FooterHeadline),
  and the email on hover or focus the address rolls up and an accent copy rolls in from
  below (two stacked spans in an overflow-hidden wrapper, transform only; the
  global reduced-motion rule makes it instant).

  Bottom row: 2 columns under 768px (nav | socials, then location |
  copyright), 12 columns from md (3 / 3 / 3 / 3).
*/

const ROLL = "block py-[0.12em] transition-transform duration-500 ease-out-expo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" data-tone="dark" className="scroll-mt-nav border-t border-line py-section">
      <Container>
        <Reveal as="div">
          <FooterHeadline />
        </Reveal>

        <Reveal as="p" index={1} className="mt-16 md:mt-24">
          <a
            href={`mailto:${site.email}`}
            className="group inline-block max-w-full font-display text-[clamp(1.75rem,8.5vw,3rem)] leading-none font-semibold tracking-[-0.025em] md:text-display md:leading-none"
          >
            <span className="relative block overflow-hidden">
              <span className={`${ROLL} group-hover:-translate-y-full group-focus-visible:-translate-y-full`}>
                {site.email}
              </span>
              <span
                aria-hidden
                className={`${ROLL} absolute inset-0 translate-y-full text-accent group-hover:translate-y-0 group-focus-visible:translate-y-0`}
              >
                {site.email}
              </span>
            </span>
          </a>
        </Reveal>

        <Reveal as="p" index={2} className="mt-6 max-w-[44ch] text-fg-2">
          {footer.note}
        </Reveal>

        <div className="mt-24 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line pt-8 text-sm md:mt-32 md:grid-cols-12">
          <nav aria-label="Footer" className="md:col-span-3">
            <ul className="flex flex-col gap-2">
              {site.nav.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link-line hover:link-line-hover">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-col gap-2 md:col-span-3">
            {site.socials.map((social) => (
              <li key={social.href}>
                <a href={social.href} target="_blank" rel="noreferrer" className="link-line hover:link-line-hover">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="md:col-span-3">
            <span className="meta block">Based in</span>
            <span className="mt-1 block">{site.location}</span>
          </p>

          <p className="text-fg-2 md:col-span-3 md:text-right">
            &copy; {year} {site.name}
          </p>
        </div>
      </Container>
    </footer>
  );
}
