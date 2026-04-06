import Link from "next/link";
import { GlowButton } from "@/components/ui/glow-button";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Documentação", href: "#docs" },
  { label: "Sobre", href: "#about" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/45 backdrop-blur-xl">
      <div className="container-ddx flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="font-[var(--font-space)] text-3xl font-bold tracking-tight">
            <span className="text-white">D</span>
            <span className="text-[#39ff14]">D</span>
            <span className="text-white">X</span>
          </div>

          <div className="hidden h-8 w-px bg-white/10 md:block" />

          <div className="hidden text-xs text-zinc-500 md:block">
            Cálculo Multivariável
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-zinc-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <GlowButton href="/app" className="px-5 py-3 text-sm">
          Launch App
        </GlowButton>
      </div>
    </header>
  );
}