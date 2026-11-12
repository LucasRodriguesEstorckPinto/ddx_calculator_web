"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { MathTex } from "@/components/calculator/math-tex";
import type { CalcStep } from "@/lib/math-api";

type StepsPanelProps = {
  steps: CalcStep[];
};

export function StepsPanel({ steps }: StepsPanelProps) {
  const [open, setOpen] = useState(true);

  if (steps.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Passo a passo ({steps.length})
        </span>
        <ChevronDown
          size={18}
          className={`text-zinc-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ol className="space-y-3 px-4 pb-4">
          {steps.map((item, index) => (
            <li
              key={`${index}-${item.title}`}
              className="rounded-xl border border-white/8 bg-black/30 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#005EB8]/20 text-xs font-semibold text-[#4da3ff]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">
                    {item.title}
                  </div>
                  {item.note && (
                    <p className="mt-1 text-sm text-zinc-400">{item.note}</p>
                  )}
                  {item.latex && (
                    <div className="mt-2 text-white">
                      <MathTex tex={item.latex} />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}