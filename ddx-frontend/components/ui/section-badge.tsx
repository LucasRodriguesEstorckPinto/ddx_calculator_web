"use client";

type SectionBadgeProps = {
  children: React.ReactNode;
  color?: "green" | "purple";
};

export function SectionBadge({
  children,
  color = "green",
}: SectionBadgeProps) {
  const styles =
    color === "green"
      ? "text-[#005EB8]"
      : "text-[#a855f7]";

  return (
    <div
      className={`mb-4 text-center text-sm font-semibold uppercase tracking-[0.22em] ${styles}`}
    >
      {children}
    </div>
  );
}