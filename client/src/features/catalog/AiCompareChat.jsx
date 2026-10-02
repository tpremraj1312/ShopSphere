import React, { useState, useEffect, useRef } from 'react';
import { useCompareWithAiMutation } from '../../store/productsApi';
import Button from '../../components/ui/Button';
import {
  Send,
  X,
  Compass,
  User,
  CheckCircle,
  HelpCircle,
  Scale,
  FileText,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Which model offers the best value for money?',
  'What are the key technical differences?',
  'Which product has the highest verified buyer rating?',
  'Which one is recommended for long-term daily use?',
];

export default function AiCompareChat({
  products = [],
  isOpen = false,
  onClose,
  initialAnalysis = null,
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [compareWithAi, { isLoading }] = useCompareWithAiMutation();
  const chatBottomRef = useRef(null);

  // Initialize consultation message
  useEffect(() => {
    if (!products || products.length === 0) {
      setMessages([]);
      return;
    }

    const defaultGreeting =
      initialAnalysis?.answer ||
      initialAnalysis?.verdict ||
      `I've analyzed the specifications and pricing for the ${products.length} models currently in your comparison list. Ask any technical or value questions to help determine the optimal choice.`;

    setMessages([
      {
        id: 'init-1',
        sender: 'advisor',
        text: defaultGreeting,
        prosCons: initialAnalysis?.prosCons || null,
      },
    ]);
  }, [products, initialAnalysis]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading || products.length === 0) return;

    // Add user question
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    try {
      const res = await compareWithAi({
        productIds: products.map((p) => p._id || p.id),
        products: products,
        question: query,
      }).unwrap();

      const data = res?.data || res;
      const reply =
        data?.answer ||
        data?.verdict ||
        data?.recommendation ||
        'Based on verified specifications, the option with the highest customer rating delivers the best overall balance.';

      const advisorMsg = {
        id: `advisor-${Date.now()}`,
        sender: 'advisor',
        text: reply,
        prosCons: data?.prosCons || null,
      };

      setMessages((prev) => [...prev, advisorMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: `advisor-err-${Date.now()}`,
        sender: 'advisor',
        text: 'Unable to refresh analysis right now. Reviewing the hardware specs table directly offers a side-by-side view of all differences.',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  if (!isOpen) return null;

  return (
    <aside aria-label="Buying Advisor panel" className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col border-l border-[#D5D9D9] animate-slideInRight">
      {/* Header — Amazon Central navy styling */}
      <div className="bg-[#232F3E] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#37475A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#37475A] text-[#FFD814] flex items-center justify-center font-bold shrink-0">
            <Scale size={18} strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-bold text-[14px] leading-tight">Buying Advisor</h2>
            <p className="text-[12px] text-[#A6B4C4]">
              Objective specification &amp; value analysis ({products.length} models)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-[#D5D9D9] hover:text-white p-1 rounded hover:bg-[#37475A] transition-colors"
          title="Close Advisor"
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested prompts */}
      <div className="p-2.5 bg-[#F7F8F8] border-b border-[#D5D9D9]">
        <p className="text-[11px] font-bold text-[#565959] uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <HelpCircle size={12} /> Suggested questions:
        </p>
        <div className="flex gap-1.5 flex-nowrap overflow-x-auto pb-1 no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="text-[11px] bg-white border border-[#D5D9D9] hover:border-[#007185] text-[#0F1111] hover:text-[#007185] hover:bg-[#F0F8FF] px-2.5 py-1 rounded-[4px] whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F0F2F2]">
        {messages.map((msg) => {
          const isAdvisor = msg.sender === 'advisor';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isAdvisor ? 'justify-start' : 'justify-end'}`}
            >
              {isAdvisor && (
                <div className="w-6 h-6 rounded bg-[#232F3E] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Compass size={13} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-[4px] p-3 text-[13px] leading-relaxed shadow-sm ${
                  isAdvisor
                    ? 'bg-white border border-[#D5D9D9] text-[#0F1111]'
                    : 'bg-[#FFD814] text-[#0F1111] font-medium border border-[#F2C200]'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Structured Breakdown Cards */}
                {isAdvisor && msg.prosCons && msg.prosCons.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#E7E7E7] space-y-2">
                    <p className="text-[11px] font-bold text-[#565959] uppercase tracking-wider">
                      Technical Assessment:
                    </p>
                    {msg.prosCons.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-[#FAFAFA] border border-[#D5D9D9] rounded p-2 text-[12px]"
                      >
                        <div className="flex items-center justify-between font-bold text-[#0F1111] mb-1">
                          <span className="line-clamp-1">{item.title}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-[#007600]/10 text-[#007600] font-bold px-1.5 py-0.5 rounded border border-[#007600]/20 shrink-0 ml-1">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.pros?.length > 0 && (
                          <div className="text-[#007600] text-[11px] space-y-0.5">
                            {item.pros.slice(0, 2).map((p, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-1">
                                <span className="font-bold">+</span>
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.cons?.length > 0 && (
                          <div className="text-[#565959] text-[11px] space-y-0.5 mt-1 pt-1 border-t border-[#EFEFEF]">
                            {item.cons.slice(0, 1).map((c, cIdx) => (
                              <div key={cIdx} className="flex items-start gap-1">
                                <span className="font-bold">-</span>
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isAdvisor && (
                <div className="w-6 h-6 rounded bg-[#37475A] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded bg-[#232F3E] text-white flex items-center justify-center shrink-0">
              <Compass size={13} />
            </div>
            <div className="bg-white border border-[#D5D9D9] rounded-[4px] p-2.5 text-[12px] text-[#565959] flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#007185] animate-ping" />
              <span>Analyzing comparative specifications and pricing metrics...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-3 bg-white border-t border-[#D5D9D9] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a technical question about these models..."
          disabled={isLoading}
          className="flex-1 h-[36px] px-3 text-[13px] border border-[#888C8C] rounded-[4px] focus:outline-none focus:border-[#E77600] focus:ring-1 focus:ring-[#E77600]"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!inputValue.trim() || isLoading}
          className="h-[36px] !px-3.5 flex items-center justify-center"
        >
          <Send size={14} />
        </Button>
      </form>
    </aside>
  );
}
