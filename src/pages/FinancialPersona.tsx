import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Brain, Star, AlertTriangle, ShieldCheck, TrendingUp, Loader2, UserCircle, Sparkles } from "lucide-react";

export default function FinancialPersona() {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersona();
  }, []);

  const fetchPersona = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financial-persona");
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="relative group flex items-center justify-center overflow-hidden transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-full p-2">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 opacity-80 animate-spin" />
          <div className="relative bg-navy rounded-full m-[2px] p-4 flex items-center justify-center">
            <Loader2 className="animate-spin text-fuchsia-400" size={32} />
          </div>
        </div>
        <p className="text-fuchsia-300 animate-pulse font-medium">
          {language === 'ar' ? 'جاري تحليل شخصيتك المالية...' : 'Analyzing your financial persona...'}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="text-red-500 mb-2" size={32} />
        <p className="text-slate-400">
          {language === 'ar' ? 'حدث خطأ أثناء جلب البيانات.' : 'Error fetching data.'}
        </p>
        <button onClick={fetchPersona} className="mt-4 px-4 py-2 bg-fuchsia-500 rounded-lg text-white">
          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-navy relative pt-4 overflow-y-auto pb-24">
      <div className="flex items-center gap-4 px-6 pb-4 border-b border-navy-light">
        <div className="relative group flex items-center justify-center overflow-hidden transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-full p-0.5">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 opacity-80" />
          <div className="relative bg-navy rounded-full m-[1px] p-2.5 flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-purple-500/10" />
             <UserCircle size={28} className="text-fuchsia-400" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            {language === 'ar' ? 'شخصيتك المالية' : 'Financial Persona'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'ar' ? 'تحليل مبني على سلوكك' : 'Behavior-based analysis'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Persona Header */}
        <div className="bg-gradient-to-b from-purple-900/40 to-navy p-6 rounded-3xl border border-fuchsia-500/30 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl"></div>
          <div className="relative p-4 rounded-full bg-navy border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-4 mt-2">
            <Brain size={40} className="text-fuchsia-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] rounded-full relative z-10" />
          </div>
          <h3 className="font-bold text-white mb-2 text-2xl">{data.personaName}</h3>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {data.description}
          </p>
        </div>

        {/* Strengths and Weaknesses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-navy-light p-5 rounded-3xl border border-teal/20">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={20} className="text-teal" />
              <h4 className="font-bold text-white">{language === 'ar' ? 'نقاط القوة' : 'Strengths'}</h4>
            </div>
            <ul className="space-y-2">
              {data.strengths?.map((str: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-teal mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy-light p-5 rounded-3xl border border-amber-500/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <h4 className="font-bold text-white">{language === 'ar' ? 'نقاط الضعف' : 'Weaknesses'}</h4>
            </div>
            <ul className="space-y-2">
              {data.weaknesses?.map((weak: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-navy-light p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <Star size={20} className="text-yellow-400" />
            <h4 className="font-bold text-white">{language === 'ar' ? 'نصائح مخصصة لك' : 'Personalized Tips'}</h4>
          </div>
          <ul className="space-y-3">
            {data.tips?.map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-3 bg-navy p-3 rounded-2xl border border-slate-800/50">
                <div className="bg-yellow-400/10 text-yellow-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300 mt-0.5">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warning & Savings Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-red-500/10 to-navy-light p-5 rounded-3xl border border-red-500/20 relative overflow-hidden">
            <AlertTriangle className="absolute -right-4 -bottom-4 text-red-500/10" size={80} />
            <h4 className="font-bold text-red-400 mb-2 relative z-10">{language === 'ar' ? 'فخ مالي احذره' : 'Financial Trap to Avoid'}</h4>
            <p className="text-sm text-slate-300 relative z-10">{data.warning}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-navy-light p-5 rounded-3xl border border-purple-500/20 relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -bottom-4 text-purple-500/10" size={80} />
            <h4 className="font-bold text-purple-400 mb-2 relative z-10">{language === 'ar' ? 'أسلوب الادخار الأنسب' : 'Best Savings Plan'}</h4>
            <p className="text-sm text-slate-300 relative z-10">{data.savingsPlan}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
