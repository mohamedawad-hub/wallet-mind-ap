import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, AlertTriangle, Lightbulb, User, MessageCircle, Send, Loader2, Brain } from 'lucide-react';
import { useCategories } from '../context/CategoriesContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AiQuotaDashboardModal from '../components/AiQuotaDashboardModal';

export default function Assistant() {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const { incrementAiUsage } = useAuth();
  const navigate = useNavigate();
  const [showAiQuotaDashboard, setShowAiQuotaDashboard] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'ai',
      type: 'tip',
      text: t('high_spending_alert'),
      icon: <Lightbulb size={20} className="text-amber-500" />
    },
    {
      id: 2,
      sender: 'ai',
      type: 'alert',
      text: t('large_amount_alert'),
      icon: <AlertTriangle size={20} className="text-red-500" />
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const isAiDisabled = localStorage.getItem('aiFeaturesDisabled') === 'true';
    if (isAiDisabled) {
      const msgText = input;
      setInput('');
      setMessages(prev => [
        ...prev, 
        { id: Date.now(), sender: 'user', type: 'msg', text: msgText },
        { 
          id: Date.now() + 1, 
          sender: 'ai', 
          type: 'alert', 
          text: language === 'ar' 
            ? '⚠️ مميزات الذكاء الاصطناعي معطلة حالياً لتوفير الكوتا. يمكنك إعادة تفعيلها من نافذة مراقبة الكوتا.' 
            : '⚠️ AI features are currently disabled to preserve your quota. You can re-enable them in the AI Quota Dashboard.',
          icon: <AlertTriangle size={20} className="text-amber-500" />
        }
      ]);
      return;
    }
    
    if (!incrementAiUsage()) {
       return;
    }

    const msgText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', type: 'msg', text: msgText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText, categories })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', type: 'msg', text: data.answer, icon: <Sparkles size={20} className="text-fuchsia-400" /> }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', type: 'msg', text: data.message || "I'm currently overloaded or reached API limits. Please try again later.", icon: <AlertTriangle size={20} className="text-amber-500" /> }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', type: 'msg', text: "Error connecting to AI.", icon: <AlertTriangle size={20} className="text-red-500" /> }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy relative pt-4">
      <div className="flex items-center justify-between px-6 pb-4 border-b border-navy-light gap-2">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative group flex items-center justify-center overflow-hidden transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-full p-0.5 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 opacity-80" />
            <div className="relative bg-navy rounded-full m-[1px] p-2.5 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-purple-500/10" />
               <Sparkles size={28} className="text-fuchsia-400 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent truncate">{t('ai_tips')}</h2>
            <p className="text-xs text-slate-400 truncate">{language === 'ar' ? 'المساعد المالي الذكي الحصري' : 'Exclusive AI Assistant'}</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAiQuotaDashboard(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 transition border border-slate-700 rounded-xl cursor-pointer shrink-0"
        >
          <Sparkles size={14} className="text-fuchsia-400 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-300 font-mono">Quota</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        
        <div className="bg-gradient-to-b from-purple-900/40 to-navy p-6 rounded-3xl border border-fuchsia-500/30 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl"></div>
          <div className="relative p-4 rounded-full bg-navy border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-4 mt-2">
            <Sparkles size={40} className="text-fuchsia-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full animate-pulse z-10 relative" />
            <div className="absolute inset-0 rounded-full border-2 border-pink-400/50 animate-ping opacity-30"></div>
          </div>
          <h3 className="font-bold text-white mb-2 text-lg">{language === 'ar' ? 'كيف يمكنني مساعدتك اليوم؟' : 'How can I help you today?'}</h3>
          <p className="text-sm text-slate-300 mb-4">{language === 'ar' ? 'أقوم بتحليل مصروفاتك بشكل مستمر لتقديم أفضل النصائح لتوفير أموالك.' : 'I analyze your spending continuously to provide the best money-saving tips.'}</p>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              onClick={() => navigate('/persona')}
              className="flex items-center gap-2 px-5 py-2.5 bg-fuchsia-500/20 text-fuchsia-300 rounded-full border border-fuchsia-500/30 hover:bg-fuchsia-500/30 transition-all font-medium text-sm"
            >
              <Brain size={16} />
              {language === 'ar' ? 'شخصيتك المالية' : 'Financial Persona'}
            </button>
            
            <button 
              onClick={() => navigate('/emergency-sos')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 text-red-300 rounded-full border border-red-500/30 hover:bg-red-500/30 transition-all font-medium text-sm"
            >
              <AlertTriangle size={16} />
              {language === 'ar' ? 'طوارئ SOS' : 'Emergency SOS'}
            </button>
          </div>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={['p-4 rounded-2xl flex gap-3', 
              msg.type === 'alert' ? 'bg-red-500/10 border border-red-500/20' : 
              msg.sender === 'user' ? 'bg-teal/10 border border-teal/20 ml-auto w-11/12 justify-end text-right rtl:text-left rtl:mr-auto rtl:ml-0' : 
              'bg-navy-light border border-slate-800 mr-auto w-11/12 justify-start rtl:ml-auto rtl:mr-0'].join(' ')}>
             {msg.sender === 'ai' && <div className="mt-1">{msg.icon}</div>}
             <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
             {msg.sender === 'user' && <div className="mt-1"><User size={20} className="text-teal" /></div>}
          </div>
        ))}
        {loading && (
          <div className="p-4 rounded-2xl flex gap-3 bg-navy-light border border-slate-800 mr-auto w-11/12 justify-start">
             <div className="mt-1"><Loader2 size={20} className="text-teal animate-spin" /></div>
             <p className="text-sm text-slate-400 font-medium">...</p>
          </div>
        )}
      </div>

      <div className="border-t border-navy-light bg-navy-dark pb-24 shrink-0">
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none hide-scroll whitespace-nowrap border-b border-slate-800/50">
          {[
            language === 'ar' ? 'مصروفات القهوة هذا الشهر؟' : 'Coffee expenses this month?',
            language === 'ar' ? 'أعلى مصاريف الأسبوع؟' : 'Highest expenses this week?',
            language === 'ar' ? 'الإيداعات فوق 5000؟' : 'Deposits over 5000?',
          ].map((q, i) => (
            <button 
              key={i} 
              onClick={() => { setInput(q); handleSend(); }} 
              className="bg-navy-light border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full hover:bg-slate-800 transition whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="p-4 relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'ar' ? "اسأل مساعدك الذكي..." : "Ask your smart assistant..."}
            className="w-full bg-navy-light border border-slate-700 text-white text-sm rounded-full py-3 pl-5 pr-12 rtl:pr-5 rtl:pl-12 outline-none placeholder:text-slate-500 focus:border-teal/50"
          />
          <button 
            disabled={loading || !input.trim()}
            onClick={handleSend}
            className="absolute right-6 (ltr:right-6) left-auto rtl:right-auto rtl:left-6 bg-teal text-navy-dark w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-opacity-90 transition shadow-lg shadow-teal/20"
          >
            <Send size={16} className="transform rtl:-scale-x-100 mr-0.5 rtl:mr-0 rtl:ml-0.5 mt-0.5" />
          </button>
        </div>
      </div>
      <AiQuotaDashboardModal 
        isOpen={showAiQuotaDashboard} 
        onClose={() => setShowAiQuotaDashboard(false)} 
      />
    </div>
  );
}
