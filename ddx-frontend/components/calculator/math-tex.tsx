"use client";

import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

type MathTexProps = {
  tex: string;
};

// Renderiza LaTeX em bloco; se o KaTeX não conseguir interpretar, mostra o texto cru
export function MathTex({ tex }: MathTexProps) {
  return (
    <div className="overflow-x-auto py-1">
      <BlockMath
        math={tex}
        renderError={() => (
          <code className="whitespace-pre-wrap break-words font-mono text-sm text-zinc-300">
            {tex}
          </code>
        )}
      />
    </div>
  );
}