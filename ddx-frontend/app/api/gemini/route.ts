import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, expression, operation, result } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const finalPrompt = `
Você é o assistente do DDX, uma interface de matemática computacional.
Responda em português do Brasil, com clareza, objetividade e linguagem didática.

FORMATAÇÃO OBRIGATÓRIA:
- Use LaTeX para toda expressão matemática.
- Use \\( ... \\) para matemática inline.
- Use \\[ ... \\] para equações em destaque.
- Não use blocos de código para fórmulas.
- Não escreva \`x**2\` nem \`3*x - 3\` em texto puro se for uma expressão matemática; converta para LaTeX.
- Não mostre o JSON bruto de entrada.
- Não repita o resultado em listas desnecessárias.

Contexto:
- Expressão: ${expression ?? ""}
- Operação: ${operation ?? ""}
- Resultado estruturado: ${JSON.stringify(result ?? {}, null, 2)}

Tarefa:
${prompt ?? "Explique o resultado, o conceito envolvido e a interpretação matemática."}

Formato ideal:
1. Resposta curta e direta.
2. Fórmula em LaTeX.
3. Explicação intuitiva.
`.trim();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: finalPrompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao consultar Gemini." },
        { status: response.status }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("\n")
        .trim() || "Sem resposta do Gemini.";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno no servidor.",
      },
      { status: 500 }
    );
  }
}