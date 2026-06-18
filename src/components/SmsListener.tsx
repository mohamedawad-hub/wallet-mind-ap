import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function SmsListener() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [incomingSms, setIncomingSms] = useState<{ text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedTx, setParsedTx] = useState<any>(null);

  useEffect(() => {
    const handleSms = (e: any) => {
      // In a real app, we check if e.detail.text contains any of our keywords in localStorage
      const stored = localStorage.getItem('smsKeywords');
      const keywords = stored ? JSON.parse(stored) : ['تم خصم', 'إيداع', 'سحب', 'instapay', 'vodafone cash', 'شراء'];
      
      const containsKeyword = keywords.some((kw: string) => e.detail.text.toLowerCase().includes(kw.toLowerCase()));
      
      if (containsKeyword) {
        setIncomingSms({ text: e.detail.text });
        setParsedTx(null);
      }
    };

    window.addEventListener('simulated_sms', handleSms);
    return () => window.removeEventListener('simulated_sms', handleSms);
  }, []);

  const handleParse = async () => {
    if (!incomingSms) return;
    try {
      setLoading(true);
      const res = await fetch("/api/parse-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: incomingSms.text }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedTx(data.data);
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert(language === 'ar' ? 'فشل القراءة' : 'Failed to parse');
    } finally {
      setLoading(false);
    }
  };

  const saveTransaction = async () => {
    if (!parsedTx) return;
    try {
      setLoading(true);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsedTx, source: 'sms_auto' }),
      });
      if (res.ok) {
        setIncomingSms(null);
        setParsedTx(null);
        // Refresh dashboard implicitly by firing an event or redirecting
        navigate('/?refresh=true');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!incomingSms) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-[slideDown_0.3s_ease-out]">
      <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        <button 
          onClick={() => { setIncomingSms(null); setParsedTx(null); }}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>
        
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shrink-0">
            <MessageSquare size={20} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              {language === 'ar' ? 'رسالة مالية جديدة' : 'New Financial SMS'}
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed opacity-80" dir="auto">
              "{incomingSms.text}"
            </p>
          </div>
        </div>

        {!parsedTx && (
          <button 
            onClick={handleParse}
            disabled={loading}
            className="w-full bg-navy-light border border-slate-700 hover:border-teal/50 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin text-teal" /> : <SparklesIcon />}
            {language === 'ar' ? 'قراءة المبلغ والإضافة تلقائياً' : 'Parse amount & Auto Add'}
          </button>
        )}

        {parsedTx && (
          <div className="mt-3 bg-navy p-3 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">{language === 'ar' ? 'المبلغ المستخرج' : 'Extracted Amount'}:</span>
              <span className={`font-bold ${parsedTx.type === 'expense' ? 'text-white' : 'text-teal'}`}>
                {parsedTx.type === 'expense' ? '-' : '+'}{parsedTx.amount} {parsedTx.currency || '$'}
              </span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400">{language === 'ar' ? 'البائع/الجهة' : 'Merchant'}:</span>
              <span className="text-sm text-slate-200 font-medium">{parsedTx.merchant || parsedTx.category}</span>
            </div>
            
            <button 
              onClick={saveTransaction}
              disabled={loading}
              className="w-full bg-teal hover:bg-opacity-90 text-navy-dark text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {language === 'ar' ? 'تأكيد وحفظ المعاملة' : 'Confirm & Save Transaction'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <path d="Mm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4M7 5H3"/>
    </svg>
  );
}
