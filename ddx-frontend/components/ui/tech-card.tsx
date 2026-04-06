import { LucideIcon } from "lucide-react";

type TechCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "green" | "purple";
};

export function TechCard({
  icon: Icon,
  title,
  description,
  tone = "green",
}: TechCardProps) {
  const iconStyles =
    tone === "green"
      ? "bg-[#39ff14]/12 text-[#39ff14]"
      : "bg-violet-500/12 text-violet-400";

  return (
    <div className="glass rounded-[24px] px-5 py-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.055]">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconStyles}`}
        >
          <Icon size={22} strokeWidth={2.2} />
        </div>

        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}