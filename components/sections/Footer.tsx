import { Container } from "@/components/ui/Container";
import { FooterHeadline } from "@/components/ui/FooterHeadline";
import { Reveal } from "@/components/ui/Reveal";
import { footer, site } from "@/content/site";

/*
  Dark footer, id="contact". The nav's "Let's Talk" opens a mail directly;
  this email link is the same intent at the end of the page. Motion
  only: the blocks enter with the shared Reveal primitive. Two toys:
  pressing the headline rolls LET'S TALK. into LET'S LARP. (FooterHeadline),
  and on hover or focus the email rolls up while a lime copy rolls in from
  below (two stacked spans in an overflow-hidden wrapper, transform only; the
  global reduced-motion rule makes it instant), and its arrow nudges up-right.

  Headline and email are one block: from md the headline takes cols 1-7 and
  the email with its note sits in cols 8-12, bottom-aligned with TALK., so
  the address reads as the answer to the headline rather than a second
  statement. Below 768px the email follows the headline closely in one column.

  Bottom row: 2 columns under 768px (nav | socials, then location |
  copyright), 12 columns from md (3 / 3 / 3 / 3).
*/

const ROLL = "block py-[0.12em] transition-transform duration-500 ease-out-expo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" data-tone="dark" className="border-t border-line py-section">
      <Container>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-12 md:items-end">
          <Reveal as="div" className="md:col-span-7">
            <FooterHeadline />
          </Reveal>

          <div className="md:col-span-5 md:col-start-8 md:pb-[0.4rem]">
            <Reveal as="p" index={1}>
              <a
                href={`mailto:${site.email}`}
                className="group inline-flex max-w-full items-start gap-[0.3em] font-display text-[clamp(1.75rem,7vw,2.5rem)] leading-none font-semibold tracking-[-0.02em] md:text-h3 md:leading-none md:font-semibold"
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
                <span
                  aria-hidden
                  className="py-[0.12em] text-[0.7em] transition-[color,translate] duration-500 ease-out-expo group-hover:translate-x-[0.12em] group-hover:-translate-y-[0.12em] group-hover:text-accent group-focus-visible:text-accent"
                >
                  &#8599;
                </span>
              </a>
            </Reveal>

            <Reveal as="p" index={2} className="mt-4 max-w-[36ch] text-fg-2">
              {footer.note}
            </Reveal>
          </div>
        </div>

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
