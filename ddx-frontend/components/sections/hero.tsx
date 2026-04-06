import { GlowButton } from "@/components/ui/glow-button";
import { SurfaceScene } from "@/components/three/surface-scene";

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="glass min-w-[160px] rounded-3xl px-8 py-5 text-center">
      <div className="text-5xl font-bold tracking-tight text-[#39ff14]">{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{label}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero-noise relative overflow-hidden pt-32">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute left-1/2 top-28 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#39ff14]/10 blur-[120px]" />
      <div className="absolute right-[18%] top-36 h-[360px] w-[360px] rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="container-ddx relative z-10 flex min-h-screen flex-col items-center justify-center pb-14 text-center">
        <div className="glass mb-8 rounded-full px-4 py-2 text-sm text-zinc-300">
          Powered by SymPy & NumPy
        </div>

        <h1 className="max-w-5xl text-5xl font-bold leading-none tracking-tight sm:text-6xl lg:text-8xl">
          <span className="text-gradient">DDX:</span> A Evolução do
          <br />
          Cálculo Multivariável
        </h1>

        <p className="mt-8 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
          Potencializando a análise matemática com SymPy e algoritmos de
          engenharia. <span className="text-[#39ff14]">Agora pronto para Cálculo 2.</span>
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <GlowButton href="/app" className="min-w-[220px]">
            COMECE AGORA
          </GlowButton>

          <GlowButton
            href="#docs"
            variant="secondary"
            className="min-w-[220px]"
          >
            Ver Documentação
          </GlowButton>
        </div>

        <div className="mt-14 flex flex-col gap-4 sm:flex-row">
          <StatCard value="100+" label="Funções" />
          <StatCard value="3D" label="Visualizações" />
          <StatCard value="∞" label="Possibilidades" />
        </div>

        <div className="mt-10 h-14 w-8 rounded-full border border-white/10 p-1">
          <div className="mx-auto h-3 w-1 rounded-full bg-[#39ff14]" />
        </div>

        <div className="relative mt-4 h-[420px] w-screen md:h-[520px] xl:h-[620px]">
            <div className="absolute left-1/2 top-0 h-full w-screen -translate-x-1/2">
                <SurfaceScene />
            </div>
        </div>
      </div>
    </section>
  );
}