import {
  Sigma,
  TrendingUp,
  Layers3,
  Grid3X3,
  Zap,
  Brain,
} from "lucide-react";

import { FeatureCard } from "@/components/ui/feature-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionBadge } from "@/components/ui/section-badge";

const features = [
  {
    icon: Grid3X3,
    title: "Matrizes e Sistemas",
    description:
      "Resolução de sistemas lineares, cálculo de determinantes e inversão de matrizes em tempo real.",
    tone: "green" as const,
  },
  {
    icon: Layers3,
    title: "Escalonamento Reduzido",
    description:
      "Algoritmos otimizados para redução de matrizes (RREF) e análise de postos passo-a-passo.",
    tone: "purple" as const,
  },
  {
    icon: TrendingUp,
    title: "Autovalores e Autovetores",
    description:
      "Decomposição espectral e análise de transformações lineares com precisão simbólica.",
    tone: "green" as const,
  },
  {
    icon: Sigma,
    title: "Cálculo Simbólico",
    description:
      "Suporte absoluto para derivadas parciais, integrais múltiplas e limites complexos.",
    tone: "purple" as const,
  },
  {
    icon: Zap,
    title: "Performance Otimizada",
    description:
      "Algoritmos em Python projetados para cálculos super-rápidos, mesmo com entradas massivas.",
    tone: "green" as const,
  },
  {
    icon: Brain,
    title: "IA Assistente",
    description:
      "Tutor inteligente integrado para explicar resultados e demonstrar conceitos matriciais.",
    tone: "purple" as const,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="container-ddx">
        <Reveal>
          <SectionBadge color="green">RECURSOS</SectionBadge>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Funcionalidades <span className="text-[#39ff14]">Poderosas</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-3xl text-center text-base leading-8 text-zinc-400 sm:text-lg">
            Ferramentas matemáticas avançadas projetadas para estudantes e
            profissionais de engenharia.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.06}>
              <FeatureCard {...feature} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}