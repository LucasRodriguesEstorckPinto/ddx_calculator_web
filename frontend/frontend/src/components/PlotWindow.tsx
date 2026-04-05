import React, { useState } from 'react';
// @ts-ignore
import * as _Plotly from 'plotly.js-basic-dist';
// @ts-ignore
import createPlotlyComponent from 'react-plotly.js/factory';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const factory = typeof createPlotlyComponent === 'function' 
  ? createPlotlyComponent 
  : (createPlotlyComponent as any).default;

const Plotly = (_Plotly as any).default || _Plotly;
const Plot = factory(Plotly);

interface PlotWindowProps {
  data: { 
    x: number[]; 
    y: number[]; 
    latex: string;
    analise: { 
      maximos: any[], 
      minimos: any[], 
      inflexao: any[],
      assintotas?: {
        verticais: number[],
        horizontais: number[],
        obliquas: { m: number, n: number }[]
      }
    } 
  } | null;
  isVisible: boolean;
}

export default function PlotWindow({ data, isVisible }: PlotWindowProps) {
  const [showMax, setShowMax] = useState(true);
  const [showMin, setShowMin] = useState(true);
  const [showInf, setShowInf] = useState(false);
  const [showAsy, setShowAsy] = useState(true); // Estado para assíntotas

  if (!isVisible || !data) return null;

  // Determinar limites Y para as linhas verticais
  const yValues = data.y.filter(v => v !== null) as number[];
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const traces: any[] = [
    {
      x: data.x,
      y: data.y,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#39FF14', width: 3, shape: 'spline' },
      fill: 'tozeroy',
      fillcolor: 'rgba(57, 255, 20, 0.05)',
      name: 'f(x)',
    }
  ];

  // Renderizar Assíntotas se ativado
  if (showAsy && data.analise.assintotas) {
    const { verticais, horizontais, obliquas } = data.analise.assintotas;

    // Verticais (x = c)
    verticais.forEach((v, i) => {
      traces.push({
        x: [v, v],
        y: [yMin * 1.5, yMax * 1.5],
        mode: 'lines',
        name: `A. Vertical ${i+1}`,
        line: { color: 'rgba(255, 255, 255, 0.3)', width: 1, dash: 'dashdot' },
        hoverinfo: 'none'
      });
    });

    // Horizontais (y = L)
    horizontais.forEach((h, i) => {
      traces.push({
        x: [data.x[0], data.x[data.x.length - 1]],
        y: [h, h],
        mode: 'lines',
        name: `A. Horizontal ${i+1}`,
        line: { color: 'rgba(255, 255, 255, 0.5)', width: 1, dash: 'dash' },
      });
    });

    // Oblíquas (y = mx + n)
    obliquas.forEach((o, i) => {
      const xStart = data.x[0];
      const xEnd = data.x[data.x.length - 1];
      traces.push({
        x: [xStart, xEnd],
        y: [o.m * xStart + o.n, o.m * xEnd + o.n],
        mode: 'lines',
        name: `A. Oblíqua ${i+1}`,
        line: { color: 'rgba(168, 85, 247, 0.5)', width: 1.5, dash: 'longdash' },
      });
    });
  }

  if (showMax && data.analise.maximos.length > 0) {
    traces.push({
      x: data.analise.maximos.map(p => p.x),
      y: data.analise.maximos.map(p => p.y),
      mode: 'markers',
      name: 'Máximo',
      marker: { color: '#ff4444', size: 12, symbol: 'triangle-up' },
      type: 'scatter'
    });
  }

  if (showMin && data.analise.minimos.length > 0) {
    traces.push({
      x: data.analise.minimos.map(p => p.x),
      y: data.analise.minimos.map(p => p.y),
      mode: 'markers',
      name: 'Mínimo',
      marker: { color: '#4444ff', size: 12, symbol: 'triangle-down' },
      type: 'scatter'
    });
  }

  if (showInf && data.analise.inflexao.length > 0) {
    traces.push({
      x: data.analise.inflexao.map(p => p.x),
      y: data.analise.inflexao.map(p => p.y),
      mode: 'markers',
      name: 'Inflexão',
      marker: { color: '#ffffff', size: 10, symbol: 'circle-open', line: { width: 2, color: '#39FF14' } },
      type: 'scatter'
    });
  }

  return (
    <div className="bg-[#0a0a0a]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl mt-8">
      {/* SELETORES DE ANÁLISE */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest w-full mb-2 font-black">Filtros de Análise de Cálculo</span>
        
        <button 
          onClick={() => setShowMax(!showMax)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showMax ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-transparent border-white/10 text-gray-500'}`}
        >
          MÁXIMOS
        </button>

        <button 
          onClick={() => setShowMin(!showMin)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showMin ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-transparent border-white/10 text-gray-500'}`}
        >
          MÍNIMOS
        </button>

        <button 
          onClick={() => setShowInf(!showInf)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showInf ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' : 'bg-transparent border-white/10 text-gray-500'}`}
        >
          INFLEXÃO
        </button>

        <button 
          onClick={() => setShowAsy(!showAsy)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showAsy ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-transparent border-white/10 text-gray-500'}`}
        >
          ASSÍNTOTAS
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40">
        <Plot
          data={traces}
          layout={{
            autosize: true,
            height: 400,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 20, b: 40, l: 40, r: 20 },
            showlegend: false,
            xaxis: { 
              gridcolor: 'rgba(255,255,255,0.03)', 
              zerolinecolor: 'rgba(255,255,255,0.2)', 
              tickfont: { color: '#666' },
              range: [data.x[0], data.x[data.x.length - 1]] 
            },
            yaxis: { 
              gridcolor: 'rgba(255,255,255,0.03)', 
              zerolinecolor: 'rgba(255,255,255,0.2)', 
              tickfont: { color: '#666' },
              autorange: true 
            },
            hovermode: 'closest',
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-[#39FF14]/10 to-transparent rounded-2xl border border-[#39FF14]/20">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 font-bold">Expressão Processada (Simbólica)</p>
        <div className="text-3xl text-white overflow-x-auto">
          <InlineMath math={`f(x) = ${data.latex}`} />
        </div>
      </div>
    </div>
  );
}