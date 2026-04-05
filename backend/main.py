
import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import numpy as np
import sympy as sp

load_dotenv()

# Configuração Direta do Google SDK (Sem LangChain)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Instruções de Sistema
SYSTEM_PROMPT = """Você é o Agente DDX (UERJ/IPRJ).
REGRAS:
1. Responda APENAS sobre matemática, cálculo e física.
2. Para qualquer outro assunto, responda EXATAMENTE: "Desculpe, mas eu sou um motor matemático e só cumpro tarefas relacionadas a cálculo e matemática."
3. Use LaTeX: $ para linha e $$ para blocos. Ex: $\\sin(x)$.
4. Responda de forma direta e acadêmica."""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    mensagem: str


class PlotRequest(BaseModel):
    expressao: str
    x_min: float = -10.0
    x_max: float = 10.0

@app.post("/api/math/plot")
async def gerar_grafico(req: PlotRequest):
    try:
        x_sym = sp.Symbol('x', real=True)
        # Limpeza da expressão para o SymPy
        raw_expr = req.expressao.replace("y =", "").replace("^", "**").strip()
        expr = sp.sympify(raw_expr)

        # 1. DERIVADAS PARA ANÁLISE
        d1 = sp.diff(expr, x_sym)
        d2 = sp.diff(d1, x_sym)

        # Função auxiliar para extrair pontos reais com segurança
        def extrair_pontos(derivada, expressao_original):
            pontos = []
            try:
                # Tentamos resolver a derivada = 0
                solucoes = sp.solve(derivada, x_sym)
                for s in solucoes:
                    # Garantimos que o ponto é real e está dentro do range visual
                    if s.is_real and req.x_min <= float(s) <= req.x_max:
                        y_val = float(expressao_original.subs(x_sym, s))
                        pontos.append({"x": float(s), "y": y_val})
            except: pass 
            return pontos

        # 2. CÁLCULO DOS PONTOS CRÍTICOS E INFLEXÃO
        todos_criticos = extrair_pontos(d1, expr)
        inflexao = extrair_pontos(d2, expr)
        
        # Classificação usando o teste da segunda derivada
        maximos = []
        minimos = []
        for p in todos_criticos:
            teste = float(d2.subs(x_sym, p['x']))
            if teste < 0: maximos.append(p)
            elif teste > 0: minimos.append(p)

        # 3. CÁLCULO DE ASSÍNTOTAS (Lógica de Limites)
        assintotas = {"verticais": [], "horizontais": [], "obliquas": []}
        
        # Verticais: Singularidades reais
        try:
            sing = sp.singularities(expr, x_sym)
            assintotas["verticais"] = [float(s) for s in sing if s.is_real]
        except: pass

        # Horizontais: Limites no infinito
        try:
            L_pos = sp.limit(expr, x_sym, sp.oo)
            if L_pos.is_real: assintotas["horizontais"].append(float(L_pos))
            L_neg = sp.limit(expr, x_sym, -sp.oo)
            if L_neg.is_real and L_neg != L_pos: assintotas["horizontais"].append(float(L_neg))
        except: pass

        # 4. GERAÇÃO DOS DADOS DO GRÁFICO (NumPy)
        f_num = sp.lambdify(x_sym, expr, modules=['numpy'])
        x_plot = np.linspace(req.x_min, req.x_max, 800)
        y_plot = f_num(x_plot)
        
        # Limpeza de valores não numéricos para o JSON
        y_plot = np.where(np.isfinite(y_plot), y_plot, None)

        return {
            "sucesso": True,
            "x": x_plot.tolist(),
            "y": y_plot.tolist(),
            "latex": sp.latex(expr),
            "analise": {
                "maximos": maximos,
                "minimos": minimos,
                "inflexao": inflexao,
                "assintotas": assintotas
            }
        }
    except Exception as e:
        print(f"Erro no processamento: {e}")
        raise HTTPException(status_code=400, detail="Erro ao analisar a função.")

@app.post("/api/agent/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        # Inicializa o modelo (Gemini 2.0 Flash é o padrão ouro de 2026)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT
        )
        
        # Chamada assíncrona nativa - Extremamente rápida
        response = await model.generate_content_async(req.mensagem)
        
        return {
            "sucesso": True,
            "resposta": response.text
        }
    except Exception as e:
        print(f"Erro no SDK: {e}")
        return {
            "sucesso": False,
            "resposta": "🚨 O Núcleo DDX encontrou um erro de processamento. Verifique a chave API."
        }

@app.get("/health")
def health(): return {"status": "DDX Turbo Online"}