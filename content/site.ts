/**
 * All visible copy lives here. Sources: the resume (public/resume.pdf) and
 * sndyy.id, September 2026. Where they disagree, the resume wins. Every
 * number below comes from the resume. Plain language only: no em-dashes.
 *
 * Photo: the site shows one personal photo, the portrait in About, a local
 * file in public/images. See public/images/README.md.
 * Project images are the public Supabase storage URLs used by sndyy.id.
 */
import portraitImg from "@/public/images/portrait.jpg";

const STORAGE = "https://foxivehwqliehofhwsrd.supabase.co/storage/v1/object/public/project-images";

export const site = {
  // Canonical address. sndyy.id redirects here (308), so search engines and
  // share previews should always see the www host.
  url: "https://www.sndyy.id",
  name: "Fahrell Sandy",
  fullName: "Fahrell Sandy Zhariif Widiatmoko",
  wordmark: "SNDYY",
  role: "Website Enthusiast",
  description:
    "Fahrell Sandy is a website enthusiast and frontend-focused software engineer in Malang, Indonesia, building web and mobile products with Next.js, React, and Expo.",
  email: "hey@sndyy.id",
  location: "Malang, Indonesia",
  availability: "Available for remote work",
  resume: "/resume.pdf",
  nav: [
    { index: "01", label: "About", href: "#about" },
    { index: "02", label: "What I do", href: "#what-i-do" },
    { index: "03", label: "Evidence", href: "#evidence" },
    { index: "04", label: "Experience", href: "#experience" },
  ],
  // The nav button opens a mail to `email`. `altLabel` shows while the footer
  // headline reads LET'S LARP.
  contact: { label: "Let's Talk", altLabel: "Let's Larp" },
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/fahrell-sandy/" },
    { label: "GitHub", href: "https://github.com/phiniqq724" },
    { label: "Resume", href: "/resume.pdf" },
  ],
};

export const hero = {
  meta: "Sandy, Indonesia",
  // Line one types between these words on a loop. Line two stays.
  words: ["WEBSITE", "MOBILE"],
  line2: "ENTHUSIAST",
  label: "Website and mobile enthusiast",
  intro: "Frontend-focused software engineer. I build web and mobile products with Next.js, React, and Expo.",
};

/** One kinetic strip on the arc. Sits between hero and about. */
export const strip = {
  text: "WEBSITE / MOBILE ENTHUSIAST /",
};

export const about = {
  heading: "About",
  statement:
    "I work where the backend meets the screen. Most of my time goes into interfaces with Next.js, React, and Expo, and I go down to the database, the API, or the auth rules whenever a feature needs it. Good software should feel quiet to use.",
  // Phrases of the statement that get the lime highlighter as the reader
  // reaches them. Exact word runs from `statement`, punctuation ignored.
  highlights: ["the backend meets the screen", "feel quiet to use"],
  portrait: { src: portraitImg, alt: `Portrait of ${site.name}` },
  facts: [
    { label: "Based in", value: "Malang, Indonesia (UTC+7)" },
    { label: "Focus", value: "Web and mobile, frontend first" },
    { label: "Currently", value: "Junior Website Developer at Wahana Makmur Sejati" },
  ],
};

export const servicesHeading = "What I do";

export const services = [
  {
    index: "01",
    title: "Front-end development",
    body: "Next.js and React interfaces built close to the design and responsive on every screen. E-Pilketos handled around 1,500 student voters on election day.",
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    preview: `${STORAGE}/1785856085273-0zb47s-Portfolio-Post-22.png`,
  },
  {
    index: "02",
    title: "Back-end development",
    body: "The parts behind the interface: databases, auth, and APIs. Supabase and PostgreSQL on my own projects, CakePHP and REST APIs at work, where one database serves several company apps.",
    tags: ["Supabase", "PostgreSQL", "CakePHP", "REST APIs"],
    preview: `${STORAGE}/1785856194382-ezau1o-Portfolio-Post-23.png`,
  },
  {
    index: "03",
    title: "Fullstack development",
    body: "Taking a product from idea to launch on my own. Semanggi went from a spreadsheet and a group chat to an app five housemates use every day.",
    tags: ["Next.js", "Expo", "Supabase", "Mendix"],
    preview: `${STORAGE}/1785856154090-42m7wh-Portfolio-Post-19.png`,
  },
  {
    index: "04",
    title: "Mobile development",
    body: "Android apps with Expo, using Jetpack Compose through Expo UI so they behave like native apps, because they are.",
    tags: ["React Native", "Expo", "Expo UI", "Jetpack Compose"],
    preview: `${STORAGE}/1785912738269-0v6otk-Portfolio-Post-20.png`,
  },
];

export const evidenceHeading = "Evidence";

/**
 * Web and mobile projects, newest first. `href` is the public link, or null
 * when there is none.
 *
 * `scheme` is the card's surface: "dark" is ink with canvas text, "light" is
 * canvas with ink text. Cards alternate, starting dark, so the stack keeps
 * its rhythm in black and white and lime stays the only color in the
 * section (the title's highlighter while a card holds full screen).
 */
export const projects = [
  {
    index: "01",
    title: "Semanggi",
    kind: "Mobile app",
    role: "Android Developer",
    partner: "Personal project",
    year: "2026",
    stack: ["Expo", "Expo UI", "Jetpack Compose", "Supabase"],
    summary:
      "A house manager for the home I rent with friends. Cleaning rotations, a guest log, bill splitting, and house rules replaced a spreadsheet and a group chat. Five residents use it every day.",
    image: `${STORAGE}/1785856154090-42m7wh-Portfolio-Post-19.png`,
    scheme: "dark",
    href: "https://github.com/Phiniqq724/manage-kontrakan",
  },
  {
    index: "02",
    title: "THR-In",
    kind: "Mobile app",
    role: "Fullstack Developer",
    partner: "Personal project",
    year: "2026",
    stack: ["React Native", "Expo", "Supabase"],
    summary:
      "A small Eid project: log the THR money my friends and I received, then rank it. Built with Expo and Supabase in about three hours.",
    image: `${STORAGE}/1785912738269-0v6otk-Portfolio-Post-20.png`,
    scheme: "light",
    href: "https://drive.google.com/file/d/1jxxmCQOmYOhAUTbEyhSRlBpLEJBrJ1H-/view?usp=sharing",
  },
  {
    index: "03",
    title: "MyEdotel.id",
    kind: "Web platform",
    role: "Front-end Developer",
    partner: "SMK Telkom Malang",
    year: "2026",
    stack: ["Next.js", "React"],
    summary:
      "One booking system for around 10 SMK Edotel hotels across East Java, with room availability, reservations, and a virtual tour. Launched at Expo Expose SMK Jawa Timur in February 2026.",
    image: `${STORAGE}/1785856085273-0zb47s-Portfolio-Post-22.png`,
    scheme: "dark",
    href: "https://myedotel.id/",
  },
  {
    index: "04",
    title: "Infra Competition",
    kind: "Competition",
    role: "Front-end Developer and Copywriter",
    partner: "Team Resolux",
    year: "2025",
    stack: ["Next.js", "React", "Meta Graph API"],
    summary:
      "Our redesign of the SMK Telkom Malang website placed Top 10 out of around 300 teams at the Jagoan Hosting Infrastructure Competition 2025. I built the frontend, pulled in live Instagram posts, and wrote the copy.",
    image: `${STORAGE}/1785856194382-ezau1o-Portfolio-Post-23.png`,
    scheme: "light",
    href: null,
  },
  {
    index: "05",
    title: "Telkom Society",
    kind: "Web platform",
    role: "Lead Front-end Developer",
    partner: "SMK Telkom Malang",
    year: "2024 - 2025",
    stack: ["Next.js", "React"],
    summary:
      "A LinkedIn-style network for hundreds of SMK Telkom Malang students and staff. I led the frontend and built profiles, connections, and the activity feed.",
    image: `${STORAGE}/1785856176458-gzr4p8-Portfolio-Post-24.png`,
    scheme: "dark",
    href: "https://telkom-society.smktelkom-mlg.sch.id/",
  },
  {
    index: "06",
    title: "E-Pilketos",
    kind: "Web platform",
    role: "Front-end Developer",
    partner: "MPK SMK Telkom Malang",
    year: "2024",
    stack: ["Next.js", "React"],
    summary:
      "The student council election platform for SMK Telkom Malang, used by around 1,500 voters. I built the landing page and admin dashboard, then ran on-site support on election day.",
    image: `${STORAGE}/1785856213393-t8osyr-Portfolio-Post-21.png`,
    scheme: "light",
    href: "https://e-pilketos.moklet.org/",
  },
] as const;

export const certificatesHeading = "Verified";

/** Verified certificates. Each links to its public verification page. */
export const certificates = [
  {
    title: "JavaScript Developer",
    issuer: "IT Specialist",
    year: "2025",
    href: "https://www.credly.com/badges/4e96f2ff-c22f-4d2a-a1e6-3d48e5af6141/linked_in_profile",
  },
  {
    title: "Front-End Developer (React)",
    issuer: "HackerRank",
    year: "2025",
    href: "https://www.hackerrank.com/certificates/a8d468826ee1",
  },
  {
    title: "Software Engineer",
    issuer: "HackerRank",
    year: "2025",
    href: "https://www.hackerrank.com/certificates/37d69c3d4593",
  },
  {
    title: "JavaScript (Intermediate)",
    issuer: "HackerRank",
    year: "2025",
    href: "https://www.hackerrank.com/certificates/d6bcd81bd6cf",
  },
  {
    title: "Node.js (Intermediate)",
    issuer: "HackerRank",
    year: "2025",
    href: "https://www.hackerrank.com/certificates/d212735f9dc4",
  },
];

export const experienceHeading = "Experience";

/** Oldest first: school, then each role up to the current one. */
export const experience = [
  {
    year: "2023",
    period: "2023 - 2026",
    role: "Vocational High School",
    company: "SMK Telkom Malang",
    href: "https://smktelkom-mlg.sch.id/",
    summary:
      "Studied programming fundamentals, data structures, and algorithms, and led the front-end division of the METIC tech community. Most of the projects above started here.",
  },
  {
    year: "2025",
    period: "2025 - 2026",
    role: "Mendix Intern",
    company: "PT. Merkle Innovation",
    href: "https://www.merkleinnovation.com/",
    summary:
      "Built and maintained low-code applications on Mendix, delivering internal tools and business process solutions with the engineering team.",
  },
  {
    year: "2026",
    period: "Jun 2026 - Now",
    role: "Junior Website Developer",
    company: "Wahana Makmur Sejati",
    href: "https://www.wahanaartha.com/",
    summary:
      "Building internal business systems with CakePHP and JavaScript on a five-person team. I wrote the team's coding standards, now used on two projects, and replaced full-page reloads with API-driven partial updates.",
  },
];

export const footer = {
  line1: "LET'S",
  line2: "TALK.",
  // Pressing the footer headline rolls line two to this and back.
  line2Alt: "LARP.",
  note: "Tell me what you are building, or just say hi. Small talk is a fine place to start.",
};
