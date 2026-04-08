"use client";

type CalcTabsProps = {
  value: "calc1" | "calc2";
  onChange: (value: "calc1" | "calc2") => void;
};

export function CalcTabs({ value, onChange }: CalcTabsProps) {
  return (
    <div className="glass inline-flex rounded-2xl p-1">
      <button
        onClick={() => onChange("calc1")}
        className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
          value === "calc1"
            ? "bg-[#39ff14] text-black"
            : "text-zinc-300 hover:bg-white/5"
        }`}
      >
        Cálculo 1
      </button>

      <button
        onClick={() => onChange("calc2")}
        className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
          value === "calc2"
            ? "bg-violet-500 text-white"
            : "text-zinc-300 hover:bg-white/5"
        }`}
      >
        Cálculo 2
      </button>
    </div>
  );
}