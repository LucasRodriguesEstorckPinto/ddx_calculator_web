import { NextResponse } from "next/server";
import OpenAI from "openai";

// Inicializa o cliente OpenAI apontando para a API do Groq
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, expression, operation, result } = body;

    const systemPrompt = `Você é o assistente de IA do DDX, um ambiente interativo de matemática para Álgebra Linear, Cálculo 1 e Cálculo 2.
Seu objetivo é explicar conceitos, passo a passo e resultados matemáticos de forma didática e clara para estudantes de engenharia.
Use formatação LaTeX para todas as expressões matemáticas (ex: $x^2$ para inline e $$x^2$$ para blocos).`;

    const userMessage = `
Operação selecionada: ${operation}
Expressão de entrada: ${expression}
Resultado calculado pelo backend (JSON): ${JSON.stringify(result)}

Pergunta do usuário: ${prompt}
`;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
    });

    return NextResponse.json({ 
      text: completion.choices[0]?.message?.content || "Sem resposta da IA." 
    });

  } catch (error: any) {
    console.error("Erro no Groq:", error);
    return NextResponse.json(
      { error: "Falha ao consultar o assistente de IA." },
      { status: 500 }
    );
  }
}