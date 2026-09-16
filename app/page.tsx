import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { Strip } from "@/components/sections/Strip";
import { About } from "@/components/sections/About";
import { WhatIDo } from "@/components/sections/WhatIDo";
import { Evidence } from "@/components/sections/Evidence";
import { Certificates } from "@/components/sections/Certificates";
import { Experience } from "@/components/sections/Experience";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <Hero />
        <Strip />
        <About />
        <WhatIDo />
        <Evidence />
        <Certificates />
        <Experience />
      </main>
      <Footer />
    </>
  );
}
