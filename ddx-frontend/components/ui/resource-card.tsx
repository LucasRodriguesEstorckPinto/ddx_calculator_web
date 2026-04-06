import { LucideIcon } from "lucide-react";

type ResourceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "green" | "purple";
};

export function ResourceCard({
  icon: Icon,
  title,
  description,
  tone = "green",
}: ResourceCardProps) {
  const iconStyles =
    tone === "green"
      ? "bg-[#39ff14]/12 text-[#39ff14]"
      : "bg-violet-500/12 text-violet-400";

  return (
    <div className="glass rounded-[26px] px-6 py-8 text-center transition duration-300 hover:-translate-y-1 hover:bg-white/[0.055]">
      <div
        className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${iconStyles}`}
      >
        <Icon size={22} strokeWidth={2.2} />
      </div>

      <h3 className="text-xl font-semibold tracking-tight text-white">
        {title}
      </h3>

      <p className="mx-auto mt-4 max-w-[24ch] text-sm leading-7 text-zinc-400">
        {description}
      </p>
    </div>
  );
}