import { BookOpen, FileCode2, Video, MessageCircle } from "lucide-react";

import { GlowButton } from "@/components/ui/glow-button";
import { ResourceCard } from "@/components/ui/resource-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionBadge } from "@/components/ui/section-badge";

const resources = [
  {
    icon: BookOpen,
    title: "Manual Completo",
    description:
      "Guia detalhado com exemplos práticos para cada funcionalidade.",
    tone: "green" as const,
  },
  {
    icon: FileCode2,
    title: "API Reference",
    description:
      "Documentação técnica para integração e extensão.",
    tone: "purple" as const,
  },
  {
    icon: Video,
    title: "Tutoriais em Vídeo",
    description:
      "Aprenda visualmente com demonstrações passo-a-passo.",
    tone: "green" as const,
  },
  {
    icon: MessageCircle,
    title: "Comunidade",
    description:
      "Tire dúvidas e compartilhe conhecimento com outros usuários.",
    tone: "purple" as const,
  },
];

export function DocsResources() {
  return (
    <section id="docs" className="relative py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-[10%] top-16 h-[280px] w-[280px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute left-[12%] bottom-8 h-[260px] w-[260px] rounded-full bg-[#39ff14]/6 blur-[120px]" />
      </div>
      <div className="container-ddx">
        <Reveal>
          <SectionBadge color="purple">APRENDA</SectionBadge>
        </Reveal>

        <Reveal delay={0.05}>
          <h2 className="mx-auto max-w-4xl text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Documentação & <span className="text-violet-400">Recursos</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-3xl text-center text-base leading-8 text-zinc-400 sm:text-lg">
            Tudo que você precisa para dominar o DDX e resolver problemas complexos.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {resources.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <ResourceCard {...item} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.18} className="mt-12 flex justify-center">
          <GlowButton
            href="#launch"
            variant="secondary"
            className="min-w-[260px] border border-violet-500/25 text-violet-300 hover:bg-violet-500/10"
          >
            Acessar Documentação
          </GlowButton>
        </Reveal>
      </div>
    </section>
  );
}