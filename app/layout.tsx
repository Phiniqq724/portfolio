import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { experience, site } from "@/content/site";

const clash = localFont({
  src: [{ path: "./fonts/ClashDisplay-Variable.woff2", weight: "200 700", style: "normal" }],
  variable: "--font-clash",
  display: "swap",
});

const switzer = localFont({
  src: [
    { path: "./fonts/Switzer-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/Switzer-VariableItalic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-switzer",
  display: "swap",
});

/*
  SEO. Title stays under 60 characters and leads with the name people search
  for; the description stays near 155 characters. Icons and share images come
  from the file conventions in /app (favicon.ico, icon.png, apple-icon.png,
  opengraph-image.png, twitter-image.png), which Next wires into <head>.
*/
const title = `${site.name}, Website Enthusiast and Frontend Developer`;
const description =
  "Fahrell Sandy is a website enthusiast and frontend-focused software engineer in Malang, Indonesia, building web and mobile products with Next.js, React and Expo.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: `%s | ${site.name}` },
  description,
  applicationName: "Sndyy",
  authors: [{ name: site.fullName, url: site.url }],
  creator: site.fullName,
  publisher: site.fullName,
  keywords: [
    "Fahrell Sandy",
    "Fahrell Sandy Zhariif Widiatmoko",
    "Sndyy",
    "sndyy.id",
    "website enthusiast",
    "frontend developer",
    "front-end developer Malang",
    "web developer Indonesia",
    "software engineer",
    "Next.js developer",
    "React developer",
    "React Native developer",
    "Expo developer",
    "portfolio",
  ],
  alternates: { canonical: "/" },
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: "Sndyy",
    title,
    description,
    locale: "en_US",
    firstName: "Fahrell",
    lastName: "Widiatmoko",
    username: "sndyy",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#f1f0ec",
  colorScheme: "light",
};

/*
  Structured data: a ProfilePage whose main entity is the Person, which is the
  schema Google documents for personal and profile sites. Every fact here is
  also visible on the page or in the resume.
*/
const current = experience[0];
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: "Sndyy",
      description,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${site.url}/#profile`,
      url: site.url,
      name: title,
      isPartOf: { "@id": `${site.url}/#website` },
      mainEntity: { "@id": `${site.url}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      givenName: "Fahrell",
      familyName: "Widiatmoko",
      alternateName: [site.fullName, "Sandy", "Sndyy"],
      url: site.url,
      image: `${site.url}/images/hero-tile.jpg`,
      email: `mailto:${site.email}`,
      jobTitle: current.role,
      worksFor: { "@type": "Organization", name: current.company, url: current.href },
      alumniOf: { "@type": "EducationalOrganization", name: "SMK Telkom Malang", url: "https://smktelkom-mlg.sch.id/" },
      address: { "@type": "PostalAddress", addressLocality: "Malang", addressCountry: "ID" },
      knowsAbout: [
        "Front-end development",
        "Back-end development",
        "Fullstack development",
        "Mobile development",
        "Next.js",
        "React",
        "React Native",
        "Expo",
        "TypeScript",
        "Supabase",
        "CakePHP",
      ],
      sameAs: site.socials.filter((s) => s.href.startsWith("http")).map((s) => s.href),
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${clash.variable} ${switzer.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <script
          type="application/ld+json"
          // JSON.stringify output with "<" escaped cannot break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
