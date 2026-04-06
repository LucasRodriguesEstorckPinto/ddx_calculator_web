import { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "green" | "purple";
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  tone = "green",
}: FeatureCardProps) {
  const iconStyles =
    tone === "green"
      ? "bg-[#39ff14]/12 text-[#39ff14]"
      : "bg-violet-500/12 text-violet-400";

  return (
    <div className="glass group rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${iconStyles}`}
      >
        <Icon size={24} strokeWidth={2.2} />
      </div>

      <h3 className="text-2xl font-semibold tracking-tight text-white">
        {title}
      </h3>

      <p className="mt-3 max-w-[30ch] text-sm leading-7 text-zinc-400">
        {description}
      </p>
    </div>
  );
}