import React, { useState } from 'react';
import axios from 'axios';
import Background3D from './components/Background3D';
import AgentChat from './components/AgentChat';
import PlotWindow from './components/PlotWindow'; // <-- IMPORTADO
import { 
  Menu, ArrowRight, Sigma, TrendingUp, Layers, 
  LineChart, Zap, BookOpen, Code2, Video, MessageSquare,
  GraduationCap, Terminal, BookMarked, Code, User
} from 'lucide-react';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // ESTADOS DO LABORATÓRIO DE CÁLCULO
  const [plotData, setPlotData] = useState(null);
  const [funcaoInput, setFuncaoInput] = useState('x**2');
  const [isPlotLoading, setIsPlotLoading] = useState(false);

  // FUNÇÃO PARA GERAR O GRÁFICO
  const handleGeneratePlot = async () => {
    setIsPlotLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/math/plot', {
        expressao: funcaoInput,
        x_min: -10,
        x_max: 10
      });
      setPlotData(response.data);
    } catch (error) {
      console.error("Erro ao gerar gráfico:", error);
      alert("Erro ao processar a função. Tente algo como x**2 ou sin(x).");
    } finally {
      setIsPlotLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative">
      <Background3D />
      
      <AgentChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-40 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-3xl font-black tracking-tighter">
              DD<span className="text-[#39FF14]">X</span>
            </span>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <img src="/uerj.png" alt="UERJ" className="h-10 object-contain" />
              <img src="/Iprj.png" alt="IPRJ" className="h-10 object-contain" />
            </div>
          </div>
          <button className="text-gray-300 hover:text-white">
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 px-6 flex flex-col items-center text-center min-h-screen justify-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#050505]/50 border border-white/10 mb-8 backdrop-blur-md">
          <Zap size={14} className="text-[#39FF14]" />
          <span className="text-sm text-gray-300">Powered by SymPy & NumPy</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400 ml-2">Project preview</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight max-w-4xl">
          DD<span className="text-purple-500">X</span>: A Evolução do <br /> Cálculo Multivariável
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
          Potencializando a análise matemática com SymPy e algoritmos de engenharia. <span className="text-[#39FF14] font-medium">Agora pronto para Cálculo 2.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-8 py-4 bg-[#39FF14] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#32e011] transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.4)]"
          >
            COMECE AGORA <ArrowRight size={20} />
          </button>
          
          <button className="px-8 py-4 bg-[#050505]/50 backdrop-blur-md border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all">
            Ver Documentação
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            { value: "100+", label: "Funções", color: "text-[#39FF14]" },
            { value: "3D", label: "Visualizações", color: "text-[#39FF14]" },
            { value: "∞", label: "Possibilidades", color: "text-gray-300" }
          ].map((stat, i) => (
            <div key={i} className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col items-center">
              <span className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.value}</span>
              <span className="text-gray-400 text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* NOVO: CALCULUS LAB (SEÇÃO DE GRÁFICOS) */}
      <section className="py-24 px-6 relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase mb-4 block">Laboratório</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Calculus <span className="text-[#39FF14]">Lab</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Visualize funções instantaneamente. O DDX processa sua expressão no backend e renderiza um gráfico interativo de alta precisão.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex flex-col md:flex-row gap-6 items-end shadow-2xl">
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-3 block font-bold">Função Matemática f(x)</label>
              <input 
                value={funcaoInput}
                onChange={(e) => setFuncaoInput(e.target.value)}
                placeholder="Ex: x**3 - 4*x"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-[#39FF14] font-mono text-lg focus:outline-none focus:border-[#39FF14]/40 transition-all"
              />
            </div>
            <button 
              onClick={handleGeneratePlot}
              disabled={isPlotLoading}
              className="w-full md:w-auto px-10 py-4 bg-[#39FF14] text-black font-black rounded-xl hover:bg-[#32e011] transition-all hover:shadow-[0_0_25px_rgba(57,255,20,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPlotLoading ? <LineChart className="animate-pulse" /> : <TrendingUp size={20} />}
              {isPlotLoading ? 'PROCESSANDO...' : 'PLOTAR AGORA'}
            </button>
          </div>

          {/* JANELA DO GRÁFICO */}
          <PlotWindow data={plotData} isVisible={plotData !== null} />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-b from-transparent to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-[#39FF14] font-semibold text-sm tracking-wider uppercase mb-4 block">Recursos</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Funcionalidades <span className="text-[#39FF14]">Poderosas</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Ferramentas matemáticas avançadas projetadas para estudantes e profissionais de engenharia.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0d110d]/90 backdrop-blur-md border border-green-900/30 rounded-3xl p-8 hover:border-[#39FF14]/50 transition-colors group">
            <div className="w-12 h-12 bg-green-900/40 rounded-xl flex items-center justify-center mb-6">
              <Sigma className="text-[#39FF14]" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Derivação Avançada</h3>
            <p className="text-gray-400 leading-relaxed">Suporte para derivadas parciais e implícitas com cálculo simbólico de alta precisão.</p>
          </div>

          <div className="bg-[#110d18]/90 backdrop-blur-md border border-purple-900/30 rounded-3xl p-8 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-900/40 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-purple-400">Limites Passo-a-Passo</h3>
            <p className="text-gray-400 leading-relaxed">Resolução de indeterminações complexas usando a regra de L'Hôpital com explicações detalhadas.</p>
          </div>

          <div className="bg-[#0d110d]/90 backdrop-blur-md border border-green-900/30 rounded-3xl p-8 hover:border-[#39FF14]/50 transition-colors">
            <div className="w-12 h-12 bg-green-900/40 rounded-xl flex items-center justify-center mb-6">
              <Layers className="text-[#39FF14]" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Integrais Múltiplas</h3>
            <p className="text-gray-400 leading-relaxed">Integração simbólica e numérica para cálculo de áreas e volumes em múltiplas dimensões.</p>
          </div>

          <div className="bg-[#110d18]/90 backdrop-blur-md border border-purple-900/30 rounded-3xl p-8 hover:border-purple-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-900/40 rounded-xl flex items-center justify-center mb-6">
              <LineChart className="text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Visualização de Dados</h3>
            <p className="text-gray-400 leading-relaxed">Gráficos 3D e 2D interativos com interpolação customizada e animações suaves.</p>
          </div>
        </div>
      </section>

      {/* DOCUMENTATION SECTION */}
      <section className="py-24 px-6 relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase mb-4 block">Aprenda</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Documentação & <span className="text-purple-500">Recursos</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Tudo o que você precisa para dominar o DDX e resolver problemas complexos.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {[
            { icon: BookOpen, title: "Manual Completo", desc: "Guia detalhado com exemplos práticos para cada funcionalidade.", color: "text-[#39FF14]", bg: "bg-green-900/20" },
            { icon: Code2, title: "API Reference", desc: "Documentação técnica para integração e extensão.", color: "text-purple-400", bg: "bg-purple-900/20" },
            { icon: Video, title: "Tutoriais em Vídeo", desc: "Aprenda visualmente com demonstrações passo-a-passo.", color: "text-[#39FF14]", bg: "bg-green-900/20" },
            { icon: MessageSquare, title: "Comunidade", desc: "Tire dúvidas e compartilhe conhecimento com outros usuários.", color: "text-purple-400", bg: "bg-purple-900/20" }
          ].map((item, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-white/5 transition-colors cursor-pointer">
              <div className={`w-14 h-14 ${item.bg} rounded-full flex items-center justify-center mb-6`}>
                <item.icon className={item.color} size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button className="px-8 py-3 bg-transparent border border-purple-500 text-purple-400 font-medium rounded-xl hover:bg-purple-500/10 transition-all flex items-center gap-2">
            <BookMarked size={18} /> Acessar Documentação
          </button>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-24 px-6 relative z-10 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <span className="text-[#39FF14] font-semibold text-sm tracking-wider uppercase mb-4 block">Sobre o DDX</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 max-w-3xl">
            Construído por <span className="text-[#39FF14]">Engenhe</span><span className="text-purple-500">iros</span>, <br /> Para Engenheiros
          </h2>
          
          <p className="text-gray-400 text-lg max-w-3xl mb-6 leading-relaxed">
            O DDX nasceu de uma necessidade real durante o curso de Engenharia da Computação. Combinando o poder do cálculo simbólico do <span className="text-[#39FF14] font-semibold">SymPy</span> com a eficiência numérica do <span className="text-purple-500 font-semibold">NumPy</span>, criamos uma ferramenta que simplifica problemas complexos de Cálculo Multivariável.
          </p>
          <p className="text-gray-400 text-lg max-w-3xl mb-12 leading-relaxed">
            Nossa missão é democratizar o aprendizado de matemática avançada, oferecendo soluções passo-a-passo que ajudam estudantes a entender não apenas o "como", mas também o "porquê" por trás de cada operação.
          </p>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 inline-flex items-center gap-6 mb-16">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Desenvolvido no</p>
              <div className="flex items-center gap-4 mt-2">
                <img src="/uerj.png" alt="UERJ" className="h-6 object-contain grayscale hover:grayscale-0 transition-all" />
                <img src="/Iprj.png" alt="IPRJ" className="h-6 object-contain grayscale hover:grayscale-0 transition-all" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-3xl">
            <div className="bg-[#050505] border border-white/5 rounded-xl p-6 flex items-center gap-6 hover:bg-[#39FF14]/5 transition-colors">
              <div className="bg-green-900/20 p-3 rounded-lg"><Terminal className="text-[#39FF14]" /></div>
              <div>
                <h4 className="font-bold text-lg">SymPy</h4>
                <p className="text-gray-400 text-sm">Motor de cálculo simbólico para derivadas, integrais e limites exatos.</p>
              </div>
            </div>
            <div className="bg-[#050505] border border-white/5 rounded-xl p-6 flex items-center gap-6 hover:bg-purple-500/5 transition-colors">
              <div className="bg-purple-900/20 p-3 rounded-lg"><Code2 className="text-purple-400" /></div>
              <div>
                <h4 className="font-bold text-lg">NumPy</h4>
                <p className="text-gray-400 text-sm">Computação numérica de alta performance para visualizações e cálculos rápidos.</p>
              </div>
            </div>
             <div className="bg-[#050505] border border-white/5 rounded-xl p-6 flex items-center gap-6 hover:bg-[#39FF14]/5 transition-colors">
              <div className="bg-green-900/20 p-3 rounded-lg"><BookOpen className="text-[#39FF14]" /></div>
              <div>
                <h4 className="font-bold text-lg">Algoritmos de Engenharia</h4>
                <p className="text-gray-400 text-sm">Métodos numéricos otimizados baseados em literatura acadêmica.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            <span className="text-3xl font-black tracking-tighter">
              DD<span className="text-[#39FF14]">X</span>
            </span>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-4">
               <img src="/uerj.png" alt="UERJ" className="h-8 object-contain opacity-50 hover:opacity-100 transition-opacity" />
               <img src="/Iprj.png" alt="IPRJ" className="h-8 object-contain opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          <div className="flex gap-8">
             <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"><Code size={16}/> GitHub</a>
             <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"><BookMarked size={16}/> Documentação</a>
             <a href="#" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"><User size={16}/> Portfólio</a>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-8">
           <a href="#" className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
             <Code className="text-gray-400" />
             <div>
               <p className="font-bold text-sm">GitHub</p>
               <p className="text-xs text-gray-500">Ver código fonte</p>
             </div>
           </a>
           <a href="#" className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
             <BookMarked className="text-gray-400" />
             <div>
               <p className="font-bold text-sm">Documentação</p>
               <p className="text-xs text-gray-500">Manual completo</p>
             </div>
           </a>
           <a href="#" className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
             <User className="text-gray-400" />
             <div>
               <p className="font-bold text-sm">Portfólio</p>
               <p className="text-xs text-gray-500">Conheça o criador</p>
             </div>
           </a>
        </div>
      </footer>
    </div>
  );
}