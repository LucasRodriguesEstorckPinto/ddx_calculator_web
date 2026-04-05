# backend/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sympy as sp
import numpy as np
from dotenv import load_dotenv

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

# Carrega a chave de API do ficheiro .env
load_dotenv()

app = FastAPI(title="DDX Neon Core", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. FERRAMENTAS MATEMÁTICAS ---

@tool
def tool_calcular_derivada(expressao: str, variavel: str = 'x') -> str:
    """Calcula a derivada de uma função matemática."""
    try:
        x = sp.Symbol(variavel)
        func = sp.sympify(expressao)
        derivada = sp.diff(func, x)
        return f"A derivada é: {sp.latex(derivada)}"
    except Exception as e:
        return f"Erro ao calcular derivada: {str(e)}"

@tool
def tool_calcular_integral(expressao: str, variavel: str = 'x') -> str:
    """Calcula a integral indefinida de uma função matemática."""
    try:
        x = sp.Symbol(variavel)
        func = sp.sympify(expressao)
        integral = sp.integrate(func, x)
        return f"A integral é: {sp.latex(integral)}"
    except Exception as e:
        return f"Erro ao calcular integral: {str(e)}"

tools = [tool_calcular_derivada, tool_calcular_integral]

# --- 2. INSTRUÇÕES RESTRITAS DO SISTEMA (O ESCUDO) ---

INSTRUCOES_SISTEMA = """Você é o Agente DDX, um assistente acadêmico avançado criado pela UERJ/IPRJ, estritamente focado em Matemática e Cálculo.

REGRAS ABSOLUTAS E INQUEBRÁVEIS:
1. TRAVA DE CONTEXTO: Você SÓ pode cumprir tarefas relacionadas a cálculo, matemática, álgebra, física ou análise numérica.
2. RECUSA DE TAREFAS: Se o usuário pedir treinos de academia, receitas, códigos de programação, textos ou qualquer assunto fora de matemática, VOCÊ ESTÁ PROIBIDO DE USAR QUALQUER FERRAMENTA (TOOL). Não tente calcular nada. Apenas responda IMEDIATAMENTE com: "Desculpe, mas eu sou um motor matemático e só cumpro tarefas relacionadas a cálculo e matemática."
3. FORMATAÇÃO OBRIGATÓRIA (LaTeX): Todas as fórmulas, equações e variáveis DEVEM ser formatadas em LaTeX puro para que o frontend renderize corretamente. 
   - Use o símbolo de dólar simples para matemática na mesma linha. Exemplo: $f(x) = x^2$
   - Use o símbolo de dólar duplo para blocos de matemática isolados. Exemplo: $$\\int x^2 dx = \\frac{x^3}{3}$$
   - Nunca use blocos de código markdown com crases para matemática.
"""

# Inicializa o LLM e o Agente com a trava
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, max_retries=1)
agente_ddx = create_react_agent(llm, tools, state_modifier=INSTRUCOES_SISTEMA)

# --- 3. MODELOS DE DADOS ---

class ChatRequest(BaseModel):
    mensagem: str

class ExpressaoRequest(BaseModel):
    expressao: str
    variavel: str = 'x'

class PlotRequest(BaseModel):
    expressao: str
    variavel: str = 'x'
    x_min: float = -10.0
    x_max: float = 10.0

# --- 4. ENDPOINTS DA API ---

@app.post("/api/agent/chat")
def chat_com_agente(req: ChatRequest):  # <-- Tirei o async
    print("\n--- NOVA REQUISIÇÃO ---")
    print(f"1. O frontend pediu: '{req.mensagem}'")
    
    try:
        print("2. Acordando o Agente Gemini...")
        
        # Tiramos o await e usamos o invoke padrão (muito mais seguro no Mac local)
        resposta_ia = agente_ddx.invoke({"messages": [("user", req.mensagem)]})
        
        print("3. O Gemini processou e devolveu a resposta!")
        texto_final = resposta_ia["messages"][-1].content
        
        return {
            "sucesso": True,
            "resposta": texto_final
        }
    except Exception as e:
        print(f"🚨 ERRO FATAL DETECTADO: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no Agente de IA: {str(e)}")

@app.post("/api/math/plot")
async def gerar_coordenadas_grafico(req: PlotRequest):
    """Gera arrays de coordenadas X e Y para renderização no frontend."""
    try:
        x_sym = sp.Symbol(req.variavel)
        func = sp.sympify(req.expressao)
        func_num = sp.lambdify(x_sym, func, 'numpy')
        
        x_vals = np.linspace(req.x_min, req.x_max, 500)
        y_vals = func_num(x_vals)
        
        # Substitui Infinitos e NaNs para manter o JSON válido
        y_vals = np.where(np.isnan(y_vals) | np.isinf(y_vals), None, y_vals)
        
        return {
            "sucesso": True,
            "expressao": req.expressao,
            "x": x_vals.tolist(),
            "y": y_vals.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar gráfico: {str(e)}")

@app.get("/health")
def status_check():
    return {"status": "DDX Neon Core Operacional"}