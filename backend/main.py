# backend/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sympy as sp
from dotenv import load_dotenv

# Importações do LangChain e Gemini
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

# --- 1. FERRAMENTAS MATEMÁTICAS DA IA (TOOL CALLING) ---

@tool
def tool_calcular_derivada(expressao: str, variavel: str = 'x') -> str:
    """Usa esta ferramenta para calcular a derivada de uma função matemática. 
    Passa a expressão (ex: 'x**2 * sin(x)') e a variável (ex: 'x')."""
    try:
        x = sp.Symbol(variavel)
        func = sp.sympify(expressao)
        derivada = sp.diff(func, x)
        return f"A derivada de {expressao} em relação a {variavel} é: {str(derivada)}. Formato LaTeX: {sp.latex(derivada)}"
    except Exception as e:
        return f"Erro ao calcular derivada: {str(e)}"

@tool
def tool_calcular_integral(expressao: str, variavel: str = 'x') -> str:
    """Usa esta ferramenta para calcular a integral indefinida de uma função matemática.
    Passa a expressão (ex: 'x**2') e a variável (ex: 'x')."""
    try:
        x = sp.Symbol(variavel)
        func = sp.sympify(expressao)
        integral = sp.integrate(func, x)
        return f"A integral de {expressao} em relação a {variavel} é: {str(integral)}. Formato LaTeX: {sp.latex(integral)}"
    except Exception as e:
        return f"Erro ao calcular integral: {str(e)}"

# Lista de ferramentas que vamos entregar à IA
tools = [tool_calcular_derivada, tool_calcular_integral]

# --- 2. INICIALIZAR O AGENTE GEMINI ---
# Certifica-te de que a GOOGLE_API_KEY está no teu ficheiro .env
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
agente_ddx = create_react_agent(llm, tools)

# --- MODELOS DE DADOS PARA A API ---
class ExpressaoRequest(BaseModel):
    expressao: str
    variavel: str = 'x'

class ChatRequest(BaseModel):
    mensagem: str

# --- 3. ENDPOINTS DA API ---

@app.post("/api/math/derivada")
async def endpoint_derivada(req: ExpressaoRequest):
    """Rota direta para a interface gráfica (sem IA)."""
    return {"resultado": tool_calcular_derivada.invoke({"expressao": req.expressao, "variavel": req.variavel})}

@app.post("/api/agent/chat")
async def chat_com_agente(req: ChatRequest):
    """Rota inteligente: A IA pensa, usa o SymPy se precisar, e responde."""
    try:
        # Pede à IA para processar a mensagem do utilizador
        resposta_ia = agente_ddx.invoke({"messages": [("user", req.mensagem)]})
        
        # Extrai a última mensagem gerada pela IA
        texto_final = resposta_ia["messages"][-1].content
        
        return {
            "sucesso": True,
            "resposta": texto_final
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no Agente de IA: {str(e)}")

@app.get("/health")
def status_check():
    return {"status": "DDX Neon Core + Agente IA Operacional"}