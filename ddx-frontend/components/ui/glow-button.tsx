"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlowButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function GlowButton({
  href = "#",
  children,
  variant = "primary",
  className,
}: GlowButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-300";

  const styles =
    variant === "primary"
      ? "bg-[#39ff14] text-black glow-green hover:shadow-[0_0_30px_rgba(57,255,20,0.35)]"
      : "glass text-white hover:bg-white/10";

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link href={href} className={cn(base, styles, className)}>
        {children}
        {variant === "primary" && <ArrowRight size={18} />}
      </Link>
    </motion.div>
  );
}