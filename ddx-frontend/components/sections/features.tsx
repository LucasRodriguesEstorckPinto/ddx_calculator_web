import {
  Sigma,
  TrendingUp,
  Layers3,
  BarChart3,
  Zap,
  Brain,
} from "lucide-react";

import { FeatureCard } from "@/components/ui/feature-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionBadge } from "@/components/ui/section-badge";

const features = [
  {
    icon: Sigma,
    title: "Derivação Avançada",
    description:
      "Suporte para derivadas parciais e implícitas com cálculo simbólico de alta precisão.",
    tone: "green" as const,
  },
  {
    icon: TrendingUp,
    title: "Limites Passo-a-Passo",
    description:
      "Resolução de indeterminações complexas usando a regra de L’Hôpital com explicações detalhadas.",
    tone: "purple" as const,
  },
  {
    icon: Layers3,
    title: "Integrais Múltiplas",
    description:
      "Integração simbólica e numérica para cálculo de áreas e volumes em múltiplas dimensões.",
    tone: "green" as const,
  },
  {
    icon: BarChart3,
    title: "Visualização de Dados",
    description:
      "Gráficos 3D e 2D interativos com interpolação customizada e animações suaves.",
    tone: "purple" as const,
  },
  {
    icon: Zap,
    title: "Performance Otimizada",
    description:
      "Algoritmos otimizados para cálculos rápidos mesmo com funções complexas.",
    tone: "green" as const,
  },
  {
    icon: Brain,
    title: "IA Assistente",
    description:
      "Sugestões inteligentes e correções automáticas para expressões matemáticas.",
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