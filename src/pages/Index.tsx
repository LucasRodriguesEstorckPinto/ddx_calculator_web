import { Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MathVisualization from "@/components/MathVisualization";
import FeaturesSection from "@/components/FeaturesSection";
import DocumentationSection from "@/components/DocumentationSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const LoadingFallback = () => (
  <div className="h-[500px] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <Suspense fallback={<LoadingFallback />}>
          <MathVisualization />
        </Suspense>
        <FeaturesSection />
        <DocumentationSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
