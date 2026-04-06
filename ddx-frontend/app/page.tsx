import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { About } from "@/components/sections/about";
import { DocsResources } from "@/components/sections/docs-resources";
import { Features } from "@/components/sections/features";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <DocsResources />
        <About />
      </main>
      <Footer />
    </>
  );
}