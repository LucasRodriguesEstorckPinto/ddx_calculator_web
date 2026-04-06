import {
  Code,
  FileText,
  User,
} from "lucide-react";

import { FooterActionCard } from "@/components/ui/footer-action-card";
import { Reveal } from "@/components/ui/reveal";

const quickLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "Documentação", href: "#docs" },
  { label: "Portfólio", href: "https://example.com" },
];

const actionCards = [
  {
    icon: Code,
    title: "GitHub",
    description: "Ver código fonte",
    href: "https://github.com",
  },
  {
    icon: FileText,
    title: "Documentação",
    description: "Manual completo",
    href: "#docs",
  },
  {
    icon: User,
    title: "Portfólio",
    description: "Conheça o criador",
    href: "https://example.com",
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-16 h-[220px] w-[220px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute right-[18%] top-10 h-[220px] w-[220px] rounded-full bg-[#39ff14]/6 blur-[120px]" />
      </div>

      <div className="container-ddx">
        <div className="flex flex-col gap-10 border-b border-white/5 pb-12 lg:flex-row lg:items-start lg:justify-between">
          <Reveal className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold tracking-tight">
                <span className="text-white">D</span>
                <span className="text-[#39ff14]">D</span>
                <span className="text-white">X</span>
              </div>

              <div className="h-10 w-px bg-white/10" />

              <div className="text-sm text-zinc-500">
                Cálculo Multivariável
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
              {quickLinks.map((item) => {
                const isExternal = item.href.startsWith("http");

                return isExternal ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </a>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {actionCards.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <FooterActionCard {...item} />
            </Reveal>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/5 pt-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">
              <span className="text-white">D</span>
              <span className="text-[#39ff14]">D</span>
              <span className="text-white">X</span>
            </span>
            <span>•</span>
            <span>Cálculo Multivariável</span>
          </div>

          <div>
            © 2026 DDX. Feito com <span className="text-red-400">❤</span> para estudantes.
          </div>
        </div>
      </div>
    </footer>
  );
}