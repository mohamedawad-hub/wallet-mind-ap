import React, { useState, useEffect } from 'react';
import { Eye, Loader2, ThumbsUp, ThumbsDown, CheckCircle2, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HiddenPatterns() {
  const { language } = useLanguage();
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'correct' | 'exception'>>({});

  const fetchPatterns = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/patterns/discover", { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setPatterns(json.patterns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleFeedback = (id: string, type: 'correct' | 'exception') => {
    setFeedbackGiven(prev => ({ ...prev, [id]: type }));
  };

  const removePattern = (id: string) => {
    setPatterns(patterns.filter(p => p.id !== id));
  };

  if (analyzing) {
    return (
      <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-sm mb-6 flex flex-col items-center justify-center min-h-[200px]">
         <div className="relative mb-4">
             <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
             <Search size={32} className="text-purple-400 relative z-10 animate-bounce" />
         </div>
         <h3 className="text-purple-300 font-bold text-center mb-1">{language === 'ar' ? 'جاري تحليل سلوكك المالي...' : 'Analyzing financial behavior...'}</h3>
         <p className="text-xs text-slate-400 text-center">{language === 'ar' ? 'الذكاء الاصطناعي يبحث عن الأنماط الخفية في معاملاتك' : 'AI is looking for hidden patterns in your transactions'}</p>
      </div>
    );
  }

  if (patterns.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {patterns.map(pattern => (
        <div key={pattern.id} className="bg-gradient-to-r from-purple-900/20 to-navy-light border border-purple-500/20 rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <button onClick={() => removePattern(pattern.id)} className="absolute top-3 right-3 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition">
             <X size={16} />
          </button>

          <div className="flex justify-between items-start gap-3 mb-3">
             <div className="flex gap-3">
               <div className="bg-purple-500/10 p-2 rounded-xl h-fit border border-purple-500/20">
                 <Eye size={20} className="text-purple-400" />
               </div>
               <div>
                 <h3 className="text-xs font-bold text-purple-400 uppercase mb-1 tracking-wider">
                   {language === 'ar' ? 'نمط اكتشفناه' : 'Discovered Pattern'}
                   <span className="text-[10px] text-slate-500 ml-2 hidden sm:inline-block">
                     ({pattern.pattern_type})
                   </span>
                 </h3>
                 <p className="text-slate-200 font-medium text-sm leading-relaxed mb-1">
                   {language === 'ar' ? pattern.description_ar : pattern.description_en}
                 </p>
                 <p className="text-slate-400 text-xs">
                   <strong className="text-slate-300">{language === 'ar' ? 'اقتراح: ' : 'Suggestion: '}</strong> 
                   {language === 'ar' ? pattern.suggestion_ar : pattern.suggestion_en}
                 </p>
               </div>
             </div>
             
             {/* Decorative mini bar chart */}
             <div className="hidden sm:flex items-end gap-1 h-8 opacity-60">
                 <div className="w-1.5 h-full bg-purple-500/20 rounded-full"></div>
                 <div className="w-1.5 h-1/2 bg-purple-500/40 rounded-full"></div>
                 <div className="w-1.5 h-3/4 bg-purple-500/60 rounded-full"></div>
                 <div className="w-1.5 h-full bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
             </div>
          </div>

          <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-purple-500/10">
            {feedbackGiven[pattern.id] ? (
               <div className="text-xs text-teal flex items-center gap-1 font-bold">
                 <CheckCircle2 size={14} />
                 {language === 'ar' ? 'شكراً لردك، سنتعلم من ذلك!' : 'Thanks, we will learn from this!'}
               </div>
            ) : (
               <>
                 <button onClick={() => handleFeedback(pattern.id, 'exception')} className="bg-slate-800 text-slate-300 hover:text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                   <ThumbsDown size={14} />
                   {language === 'ar' ? 'هذا كان استثناء' : 'This is an exception'}
                 </button>
                 <button onClick={() => handleFeedback(pattern.id, 'correct')} className="bg-purple-500/20 text-purple-300 hover:text-purple-100 border border-purple-500/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                   <ThumbsUp size={14} />
                   {language === 'ar' ? 'هذا صحيح' : 'This is true'}
                 </button>
               </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
