import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentChat({ isOpen, onClose }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', content: 'Olá! Sou o Agente DDX. Posso calcular derivadas, integrais e limites para você usando o motor SymPy. O que vamos resolver hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rola para o fim sempre que uma nova mensagem chega
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Faz a chamada para a nossa API Python!
      const response = await axios.post('http://127.0.0.1:8000/api/agent/chat', {
        mensagem: userMessage.content
      });

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.data.resposta
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'agent', 
        content: '🚨 Erro de conexão com o Núcleo DDX. Verifique se o backend (FastAPI) está rodando.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[#050505]/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(57,255,20,0.1)] z-50 flex flex-col transform transition-transform duration-300">
      {/* Header do Chat */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#39FF14]/10 rounded-full flex items-center justify-center border border-[#39FF14]/30">
            <Bot className="text-[#39FF14]" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-tight">Agente DDX</h3>
            <p className="text-xs text-[#39FF14] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-[#39FF14]/20 text-[#39FF14]'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-purple-500/10 border border-purple-500/20 text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
            }`}>
              {/* O ReactMarkdown vai converter o LaTeX ($...$) em matemática renderizada! */}
              {/* Movemos o className para uma div em volta e adicionamos max-w-none para não quebrar a largura */}
            <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 max-w-none">
            <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
            >
                {msg.content}
            </ReactMarkdown>
            </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 text-[#39FF14] flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Processando no SymPy...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Qual a derivada de x^2 * sin(x)?"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 text-[#39FF14] hover:bg-[#39FF14]/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}