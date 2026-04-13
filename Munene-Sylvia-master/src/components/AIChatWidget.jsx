import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { generateContentStream } from '../services/aiService';
import './AIChatWidget.css';

export default function AIChatWidget({ mpesaTransactions = [], b2cTransactions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hi! I'm Penny, your AI Financial Advisor. How can I help you with your budget or investments today?",
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { id: Date.now(), role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const assistantMessageId = Date.now() + 1;
    let currentAssistantText = '';

    setMessages(prev => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', text: '' }
    ]);

    try {
      const txContext = `
      Recent Deposits: ${JSON.stringify(mpesaTransactions.slice(0, 5))}
      Recent Withdrawals: ${JSON.stringify(b2cTransactions.slice(0, 5))}
      `;

      // Adding a concise system instruction prefix to ensure the AI acts as a finance expert
      const systemPrompt = `You are Penny, an expert personal finance AI assistant for a budgeting app. Keep your answers concise, friendly, and formatted. NEVER use emojis in your response. Here are the user's recent transactions for context: ${txContext}. The user says: ${inputValue}`;

      await generateContentStream(systemPrompt, (chunk) => {
        currentAssistantText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, text: currentAssistantText } : msg
        ));
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? { ...msg, text: "Sorry, I'm having trouble connecting right now. Please check if your VITE_GEMINI_API_KEY is properly set." } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-widget-container">
      {isOpen ? (
        <div className="card-glass ai-chat-window">
          <div className="ai-chat-header">
            <h3><Sparkles size={20} /> Penny AI</h3>
            <button className="ai-chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={20} />
            </button>
          </div>
          
          <div className="ai-chat-body">
            {messages.map(msg => (
              <div key={msg.id} className={`ai-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="ai-typing-indicator">
                Thinking
                <div className="ai-typing-dot"></div>
                <div className="ai-typing-dot"></div>
                <div className="ai-typing-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-chat-input-area">
            <input 
              type="text" 
              placeholder="Ask me about your finances..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button className="ai-chat-send" onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button className="ai-fab" onClick={() => setIsOpen(true)} title="Ask AI Advisor">
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
}
