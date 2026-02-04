import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, BookOpen } from 'lucide-react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { iaApi } from '@/services/api';

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export const TutorScribia: React.FC = () => {
  const { user } = useCustomAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [interacaoId, setInteracaoId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      iniciarConversa();
    }
  }, []);

  const iniciarConversa = async () => {
    try {
      setIsTyping(true);
      const response = await iaApi.iniciar('tutor');
      const data = response.data.data || response.data;
      
      setInteracaoId(data.interacao_id);
      
      setTimeout(() => {
        const mensagem = data.mensagem;
        addBotMessage(mensagem.text);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      setIsTyping(false);
    }
  };

  const addBotMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now(),
      type: 'bot',
      content: content.replace(/\*([^*]+)\*/g, '$1'),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now(),
      type: 'user', 
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !interacaoId) return;

    addUserMessage(currentInput);
    const userQuestion = currentInput;
    setCurrentInput('');
    setIsTyping(true);
    
    try {
      const response = await iaApi.responder(interacaoId, userQuestion);
      const data = response.data.data || response.data;
      
      setTimeout(() => {
        const mensagem = data.mensagem;
        addBotMessage(mensagem.text);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-6 bg-white border-b shadow-sm">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white mr-4">
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tutor ScribIA</h2>
          <p className="flex items-center text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Pronto para ajudar
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'bot' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-400 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {message.type === 'bot' ? <BookOpen size={20} /> : <User size={20} />}
            </div>
            
            <div className={`flex flex-col max-w-[70%] ${message.type === 'user' ? 'items-end' : ''}`}>
              <div className={`rounded-2xl p-3 shadow-sm ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-900'
              }`}>
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className="leading-relaxed">{line}</p>
                ))}
              </div>
              
              <span className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 text-white">
              <BookOpen size={20} />
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-end gap-3">
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre suas palestras e transcrições..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!currentInput.trim()}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
