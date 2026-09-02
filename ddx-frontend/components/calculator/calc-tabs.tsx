"use client";

type CalcMode = "alglin" | "calc1" | "calc2";

type CalcTabsProps = {
  value: CalcMode;
  onChange: (value: CalcMode) => void;
};

export function CalcTabs({ value, onChange }: CalcTabsProps) {
  return (
    <div className="glass inline-flex rounded-2xl p-1 overflow-x-auto">
      <button
        onClick={() => onChange("alglin")}
        className={`rounded-xl px-5 py-3 text-sm font-medium transition whitespace-nowrap ${
          value === "alglin"
            ? "bg-[#005EB8] text-black" 
            : "text-zinc-300 hover:bg-white/5"
        }`}
      >
        Álgebra Linear
      </button>

      <button
        onClick={() => onChange("calc1")}
        className={`rounded-xl px-5 py-3 text-sm font-medium transition whitespace-nowrap ${
          value === "calc1"
            ? "bg-[#005EB8] text-black"
            : "text-zinc-300 hover:bg-white/5"
        }`}
      >
        Cálculo 1
      </button>

      <button
        onClick={() => onChange("calc2")}
        className={`rounded-xl px-5 py-3 text-sm font-medium transition whitespace-nowrap ${
          value === "calc2"
            ? "bg-[#005EB8] text-white"
            : "text-zinc-300 hover:bg-white/5"
        }`}
      >
        Cálculo 2
      </button>
    </div>
  );
}