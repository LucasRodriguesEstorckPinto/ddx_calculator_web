import React, { useState } from 'react';
// @ts-ignore
import * as _Plotly from 'plotly.js-basic-dist';
// @ts-ignore
import createPlotlyComponent from 'react-plotly.js/factory';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const factory = typeof createPlotlyComponent === 'function' ? createPlotlyComponent : (createPlotlyComponent as any).default;
const Plotly = (_Plotly as any).default || _Plotly;
const Plot = factory(Plotly);

interface PlotWindowProps {
  data: { 
    is_3d: boolean;
    x: number[]; y: number[]; z?: number[][];
    latex: string;
    analise?: { 
      maximos: any[], minimos: any[], inflexao: any[],
      assintotas: { verticais: number[], horizontais: number[], obliquas: any[] }
    } 
  } | null;
  isVisible: boolean;
}

export default function PlotWindow({ data, isVisible }: PlotWindowProps) {
  const [showMax, setShowMax] = useState(true);
  const [showMin, setShowMin] = useState(true);
  const [showInf, setShowInf] = useState(false);
  const [showAsy, setShowAsy] = useState(true);

  if (!isVisible || !data) return null;

  let traces: any[] = [];
  let layoutConfig: any = {};

  if (data.is_3d && data.z) {
    // ================== PLOT 3D ==================
    traces = [{
      z: data.z, x: data.x, y: data.y,
      type: 'surface',
      colorscale: [[0, '#0a0a0a'], [0.5, '#4444ff'], [1, '#39FF14']],
      showscale: false
    }];
    layoutConfig = {
      scene: {
        xaxis: { gridcolor: '#222', zerolinecolor: '#39FF14', title: 'X', showbackground: false },
        yaxis: { gridcolor: '#222', zerolinecolor: '#39FF14', title: 'Y', showbackground: false },
        zaxis: { gridcolor: '#222', zerolinecolor: '#39FF14', title: 'Z', showbackground: false },
        camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
      }
    };
  } else {
    // ================== PLOT 2D ==================
    const validY = data.y.filter(v => v !== null && !isNaN(v));
    const yMin = validY.length ? Math.min(...validY) : -10;
    const yMax = validY.length ? Math.max(...validY) : 10;

    traces.push({
      x: data.x, y: data.y, type: 'scatter', mode: 'lines',
      line: { color: '#39FF14', width: 3, shape: 'spline' },
      fill: 'tozeroy', fillcolor: 'rgba(57, 255, 20, 0.05)', name: 'f(x)',
    });

    if (data.analise) {
      if (showAsy) {
        data.analise.assintotas.verticais.forEach(v => traces.push({
          x: [v, v], y: [yMin * 1.5, yMax * 1.5], mode: 'lines', hoverinfo: 'none',
          line: { color: 'rgba(255, 255, 255, 0.3)', width: 1, dash: 'dashdot' }, name: 'Assíntota V'
        }));
        data.analise.assintotas.horizontais.forEach(h => traces.push({
          x: [data.x[0], data.x[data.x.length - 1]], y: [h, h], mode: 'lines',
          line: { color: 'rgba(255, 255, 255, 0.5)', width: 1, dash: 'dash' }, name: 'Assíntota H'
        }));
      }
      if (showMax) data.analise.maximos.forEach(p => traces.push({ x: [p.x], y: [p.y], mode: 'markers', name: 'Máx', marker: { color: '#ff4444', size: 12, symbol: 'triangle-up' } }));
      if (showMin) data.analise.minimos.forEach(p => traces.push({ x: [p.x], y: [p.y], mode: 'markers', name: 'Mín', marker: { color: '#4444ff', size: 12, symbol: 'triangle-down' } }));
      if (showInf) data.analise.inflexao.forEach(p => traces.push({ x: [p.x], y: [p.y], mode: 'markers', name: 'Inf', marker: { color: '#ffffff', size: 10, symbol: 'circle-open' } }));
    }

    layoutConfig = {
      xaxis: { gridcolor: 'rgba(255,255,255,0.03)', zerolinecolor: 'rgba(255,255,255,0.2)', tickfont: { color: '#666' } },
      yaxis: { gridcolor: 'rgba(255,255,255,0.03)', zerolinecolor: 'rgba(255,255,255,0.2)', tickfont: { color: '#666' }, autorange: true },
      hovermode: 'closest',
    };
  }

  return (
    <div className="bg-[#0a0a0a]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl mt-8">
      
      {/* SELETORES SÓ APARECEM NO MODO 2D */}
      {!data.is_3d && (
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest w-full mb-2 font-black">Filtros de Análise de Cálculo</span>
          <button onClick={() => setShowMax(!showMax)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${showMax ? 'bg-red-500/20 border-red-500 text-red-500' : 'border-white/10 text-gray-500'}`}>MÁXIMOS</button>
          <button onClick={() => setShowMin(!showMin)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${showMin ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'border-white/10 text-gray-500'}`}>MÍNIMOS</button>
          <button onClick={() => setShowInf(!showInf)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${showInf ? 'bg-[#39FF14]/20 border-[#39FF14] text-[#39FF14]' : 'border-white/10 text-gray-500'}`}>INFLEXÃO</button>
          <button onClick={() => setShowAsy(!showAsy)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${showAsy ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-white/10 text-gray-500'}`}>ASSÍNTOTAS</button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40">
        <Plot
          data={traces}
          layout={{
            autosize: true, height: data.is_3d ? 500 : 400,
            paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 20, b: 40, l: 40, r: 20 }, showlegend: false,
            ...layoutConfig
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-[#39FF14]/10 to-transparent rounded-2xl border border-[#39FF14]/20">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-3 font-bold">
          {data.is_3d ? "Superfície Multivariável (3D)" : "Expressão Processada (2D)"}
        </p>
        <div className="text-3xl text-white overflow-x-auto">
          <InlineMath math={data.is_3d ? `f(x, y) = ${data.latex}` : `f(x) = ${data.latex}`} />
        </div>
      </div>
    </div>
  );
}