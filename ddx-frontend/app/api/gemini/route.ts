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

    const userPrompt = `
Você é o assistente do DDX.
Explique de forma clara e objetiva.

Expressão: ${expression ?? ""}
Operação: ${operation ?? ""}
Resultado: ${JSON.stringify(result ?? {}, null, 2)}

Pergunta do usuário:
${prompt ?? "Explique o resultado e o conceito envolvido."}
    `.trim();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userPrompt }],
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
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ??
      "Sem resposta do modelo.";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 }
    );
  }
}