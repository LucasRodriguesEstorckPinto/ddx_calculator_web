import {
  BookOpen,
  Code2,
  Cpu,
  GraduationCap,
} from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionBadge } from "@/components/ui/section-badge";
import { TechCard } from "@/components/ui/tech-card";

const techItems = [
  {
    icon: Code2,
    title: "SymPy",
    description:
      "Motor de cálculo simbólico para derivadas, integrais e limites exatos.",
    tone: "green" as const,
  },
  {
    icon: Cpu,
    title: "NumPy",
    description:
      "Computação numérica de alta performance para visualizações e cálculos rápidos.",
    tone: "purple" as const,
  },
  {
    icon: BookOpen,
    title: "Algoritmos de Engenharia",
    description:
      "Métodos numéricos otimizados baseados em literatura acadêmica.",
    tone: "green" as const,
  },
];

export function About() {
  return (
    <section id="about" className="relative py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[16%] top-24 h-[260px] w-[260px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute right-[12%] top-20 h-[280px] w-[280px] rounded-full bg-[#39ff14]/8 blur-[120px]" />
      </div>

      <div className="container-ddx grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Reveal>
            <SectionBadge color="green">SOBRE O DDX</SectionBadge>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Construído por <span className="text-[#39ff14]">Engenheiros</span>,
              <br />
              Para Engenheiros
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              O DDX nasceu de uma necessidade real durante o curso de Engenharia
              da Computação. Combinando o poder do cálculo simbólico do{" "}
              <span className="text-[#39ff14]">SymPy</span> com a eficiência
              numérica do <span className="text-violet-400">NumPy</span>,
              criamos uma ferramenta que simplifica problemas complexos de
              Cálculo Multivariável.
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Nossa missão é democratizar o aprendizado de matemática avançada,
              oferecendo soluções passo-a-passo que ajudam estudantes a entender
              não apenas o “como”, mas também o “porquê” por trás de cada operação.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="glass mt-10 inline-flex items-center gap-4 rounded-[24px] px-5 py-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#39ff14]/12 text-[#39ff14]">
                <GraduationCap size={24} strokeWidth={2.2} />
              </div>

              <div>
                <div className="text-sm text-zinc-500">Desenvolvido no</div>
                <div className="mt-1 text-sm font-medium text-zinc-200">
                  ambiente acadêmico e orientado por prática real
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="space-y-5">
          {techItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <TechCard {...item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}