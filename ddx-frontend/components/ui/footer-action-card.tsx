import { LucideIcon, ExternalLink } from "lucide-react";

type FooterActionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
};

export function FooterActionCard({
  icon: Icon,
  title,
  description,
  href,
}: FooterActionCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass group flex min-h-[88px] items-center gap-4 rounded-[22px] px-5 py-4 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.055]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-zinc-200">
        <Icon size={20} strokeWidth={2.1} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <span>{title}</span>
          <ExternalLink size={15} className="text-zinc-500 transition group-hover:text-zinc-300" />
        </div>

        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </a>
  );
}