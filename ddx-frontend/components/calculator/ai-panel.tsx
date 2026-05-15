"use client";

import { Fragment, useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

type AiPanelProps = {
  expression: string;
  selectedOperation: string;
  result?: unknown;
};

function cleanAnswer(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n") 
    .trim();
}

function normalizeLatex(text: string) {
  return cleanAnswer(text)
    .replace(/\\\[(.*?)\\\]/gs, (_, content) => `@@BLOCK@@${content.trim()}@@ENDBLOCK@@`)
    .replace(/\\\((.*?)\\\)/gs, (_, content) => `@@INLINE@@${content.trim()}@@ENDINLINE@@`);
}

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

function parseSegments(text: string): Segment[] {
  const normalized = normalizeLatex(text);
  const segments: Segment[] = [];

  const pattern =
    /@@BLOCK@@([\s\S]*?)@@ENDBLOCK@@|@@INLINE@@([\s\S]*?)@@ENDINLINE@@/g;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized))) {
    if (match.index > cursor) {
      segments.push({
        type: "text",
        value: normalized.slice(cursor, match.index),
      });
    }

    if (match[1] != null) {
      segments.push({ type: "block", value: match[1].trim() });
    } else if (match[2] != null) {
      segments.push({ type: "inline", value: match[2].trim() });
    }

    cursor = pattern.lastIndex;
  }

  if (cursor < normalized.length) {
    segments.push({
      type: "text",
      value: normalized.slice(cursor),
    });
  }

  return segments;
}

function LatexRichText({ text }: { text: string }) {
  const segments = useMemo(() => parseSegments(text), [text]);

  const paragraphs: Array<Array<Segment>> = [];
  let current: Array<Segment> = [];

  for (const segment of segments) {
    if (segment.type === "text") {
      const chunks = segment.value.split("\n\n");

      chunks.forEach((chunk, index) => {
        if (chunk) {
          current.push({ type: "text", value: chunk });
        }

        if (index < chunks.length - 1) {
          if (current.length > 0) paragraphs.push(current);
          current = [];
        }
      });
    } else if (segment.type === "block") {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
      paragraphs.push([segment]);
    } else {
      current.push(segment);
    }
  }

  if (current.length > 0) {
    paragraphs.push(current);
  }

  return (
    <div className="space-y-4 text-sm leading-7 text-white/85">
      {paragraphs.map((paragraph, idx) => {
        const isBlockOnly =
          paragraph.length === 1 && paragraph[0]?.type === "block";

        if (isBlockOnly) {
          return (
            <div
              key={idx}
              className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3"
            >
              <BlockMath math={paragraph[0].value} />
            </div>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-wrap break-words">
            {paragraph.map((part, partIdx) => {
              if (part.type === "text") {
                return <Fragment key={partIdx}>{part.value}</Fragment>;
              }

              if (part.type === "inline") {
                return <InlineMath key={partIdx} math={part.value} />;
              }

              return null;
            })}
          </p>
        );
      })}
    </div>
  );
}

export function AiPanel({
  expression,
  selectedOperation,
  result,
}: AiPanelProps) {
  const [prompt, setPrompt] = useState(
    "Explique o resultado e o conceito envolvido."
  );
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAskGemini() {
    if (!expression.trim()) {
      setError("Digite uma expressão antes de consultar o assistente.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          expression,
          operation: selectedOperation,
          result,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const rawError = data?.error || "Falha ao consultar o Gemini.";

        if (
          typeof rawError === "string" &&
          rawError.toLowerCase().includes("high demand")
        ) {
          throw new Error(
            "O Gemini está em alta demanda agora. Tente novamente em instantes."
          );
        }

        throw new Error(rawError);
      }

      setAnswer(cleanAnswer(data.text || "Sem resposta."));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
          Assistente IA
        </p>
        <h3 className="text-xl font-semibold text-white">Gemini no DDX</h3>
        <p className="mt-2 text-sm text-white/60">
          Use o Gemini para interpretar resultados, explicar conceitos e
          contextualizar a operação selecionada.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-lime-400/50"
          placeholder="Ex.: Explique o resultado de forma intuitiva."
        />

        <button
          type="button"
          onClick={handleAskGemini}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Consultando..." : "Perguntar ao Gemini"}
        </button>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {answer ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <LatexRichText text={answer} />
          </div>
        ) : null}
      </div>
    </section>
  );
}