import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import numpy as np
import sympy as sp

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """Você é o Agente DDX (UERJ/IPRJ).
REGRAS:
1. Responda APENAS sobre matemática, cálculo e física.
2. Para qualquer outro assunto, responda EXATAMENTE: "Desculpe, mas eu sou um motor matemático e só cumpro tarefas relacionadas a cálculo e matemática."
3. Use LaTeX: $ para linha e $$ para blocos.
4. Responda de forma direta e acadêmica."""

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel): mensagem: str
class PlotRequest(BaseModel):
    expressao: str
    x_min: float = -10.0
    x_max: float = 10.0

@app.post("/api/math/plot")
async def gerar_grafico(req: PlotRequest):
    try:
        # Tratamento da String
        raw_expr = req.expressao.replace("z =", "").replace("y =", "").replace("^", "**").strip()
        
        # Permitindo X e Y para suporte 3D
        var_dict = {'x': sp.Symbol('x', real=True), 'y': sp.Symbol('y', real=True)}
        expr = sp.sympify(raw_expr, locals=var_dict)
        
        simbolos = {s.name for s in expr.free_symbols}
        is_3d = 'y' in simbolos

        # ==========================================
        # MODO 3D (Superfícies)
        # ==========================================
        if is_3d:
            f_num = sp.lambdify((var_dict['x'], var_dict['y']), expr, modules=['numpy'])
            x_vals = np.linspace(req.x_min, req.x_max, 100)
            y_vals = np.linspace(req.x_min, req.x_max, 100)
            X, Y = np.meshgrid(x_vals, y_vals)
            Z = f_num(X, Y)
            Z = np.where(np.isfinite(Z), Z, None) # Limpeza JSON
            
            return {
                "sucesso": True, "is_3d": True,
                "x": x_vals.tolist(), "y": y_vals.tolist(), "z": Z.tolist(),
                "latex": sp.latex(expr), "analise": None
            }

        # ==========================================
        # MODO 2D (Com Análise Numérica Blindada)
        # ==========================================
        x_sym = var_dict['x']
        f_num = sp.lambdify(x_sym, expr, modules=['numpy'])
        x_plot = np.linspace(req.x_min, req.x_max, 1000)
        y_plot = f_num(x_plot)

        # Usando NumPY para encontrar Máximos, Mínimos e Inflexão (100% de precisão visual e não trava)
        maximos, minimos, inflexao = [], [], []
        valid_mask = np.isfinite(y_plot)
        y_clean = np.where(valid_mask, y_plot, np.nan)

        # Encontrando Picos e Vales
        for i in range(1, len(y_clean) - 1):
            if not (valid_mask[i-1] and valid_mask[i] and valid_mask[i+1]): continue
            if y_clean[i-1] < y_clean[i] > y_clean[i+1]:
                maximos.append({"x": float(x_plot[i]), "y": float(y_clean[i])})
            elif y_clean[i-1] > y_clean[i] < y_clean[i+1]:
                minimos.append({"x": float(x_plot[i]), "y": float(y_clean[i])})

        # Encontrando Inflexão (Mudança de sinal na derivada segunda)
        dy = np.gradient(y_clean, x_plot)
        d2y = np.gradient(dy, x_plot)
        for i in range(1, len(d2y) - 1):
            if not (valid_mask[i-1] and valid_mask[i] and valid_mask[i+1]): continue
            if d2y[i-1] * d2y[i+1] < 0: # Cruzou o zero
                inflexao.append({"x": float(x_plot[i]), "y": float(y_clean[i])})

        # Assíntotas (Isoladas em blocos try/except para não quebrar a API)
        ass = {"verticais": [], "horizontais": [], "obliquas": []}
        try:
            for s in sp.singularities(expr, x_sym):
                if s.is_real: ass["verticais"].append(float(s))
        except: pass
        try:
            lim_p = sp.limit(expr, x_sym, sp.oo)
            if lim_p.is_real: ass["horizontais"].append(float(lim_p))
        except: pass

        y_out = np.where(valid_mask, y_plot, None)

        return {
            "sucesso": True, "is_3d": False,
            "x": x_plot.tolist(), "y": y_out.tolist(), "latex": sp.latex(expr),
            "analise": {"maximos": maximos, "minimos": minimos, "inflexao": inflexao, "assintotas": ass}
        }
    except Exception as e:
        print(f"Erro Plot: {e}")
        raise HTTPException(status_code=400, detail="Sintaxe inválida ou função não suportada.")

@app.post("/api/agent/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        model = genai.GenerativeModel(model_name="gemini-2.5-flash", system_instruction=SYSTEM_PROMPT)
        response = await model.generate_content_async(req.mensagem)
        return {"sucesso": True, "resposta": response.text}
    except Exception as e:
        return {"sucesso": False, "resposta": f"🚨 Erro: {str(e)}"}

@app.get("/health")
def health(): return {"status": "DDX Turbo Online"}