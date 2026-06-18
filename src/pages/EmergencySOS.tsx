import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, Loader2, Sparkles, HandPlatter, TrendingDown, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function EmergencySOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input');
  const [emergencyName, setEmergencyName] = useState('');
  const [amount, setAmount] = useState('');
  
  const [report, setReport] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyName.trim() || !amount.trim()) return;

    setStep('analyzing');
    try {
      const res = await fetch('/api/emergency-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyName, amount: Number(amount) })
      });
      const data = await res.json();
      if (data.success) {
        setReport(data);
        setStep('result');
      } else {
        setStep('input');
        alert(language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Error occurred. Try again.');
      }
    } catch (err) {
      console.error(err);
      setStep('input');
      alert(language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Error occurred. Try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy relative pt-4 overflow-y-auto pb-24">
      <div className="flex items-center gap-4 px-6 pb-4 border-b border-navy-light sticky top-0 bg-navy z-10">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition">
           {language === 'ar' ? <ArrowLeft size={24} className="rotate-180" /> : <ArrowLeft size={24} />}
        </button>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-2">
            <ShieldAlert size={20} className="text-red-400" />
            {language === 'ar' ? 'نمط الطوارئ SOS' : 'Emergency SOS Mode'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'ar' ? 'مساعدك وقت الأزمات المفاجئة' : 'Your crisis advisor'}
          </p>
        </div>
      </div>

      <div className="p-6">
        {step === 'input' && (
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="bg-gradient-to-b from-red-900/40 to-navy p-6 rounded-3xl border border-red-500/30 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
               <div className="relative p-4 rounded-full bg-navy border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-4 mt-2">
                 <AlertTriangle size={40} className="text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] rounded-full animate-pulse relative z-10" />
               </div>
               <h3 className="font-bold text-white mb-2 text-2xl">{language === 'ar' ? 'لا تقلق، نحن معك' : 'Don\'t worry, we got you'}</h3>
               <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                 {language === 'ar' 
                   ? 'اكتب طبيعة الطارئ والمبلغ المطلوب وسنبحث في وضعك المالي لنجد أفضل وأأمن حل.' 
                   : 'Write the nature of the emergency and amount needed. We will analyze your finances for the safest solution.'}
               </p>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {language === 'ar' ? 'ما هو الطارئ؟' : 'What is the emergency?'}
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: عطل في السيارة، مصاريف طبية' : 'e.g. Car repair, Medical bill'}
                    className="w-full bg-navy-light text-white border border-slate-700 rounded-xl px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {language === 'ar' ? 'المبلغ المطلوب' : 'Amount needed'}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-navy-light text-white border border-slate-700 rounded-xl px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
                    required
                    min="1"
                  />
                </div>
             </div>

             <button type="submit" className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold py-4 rounded-xl shadow-[0_5px_20px_rgba(239,68,68,0.4)] hover:opacity-90 transition flex items-center justify-center gap-2">
                <Sparkles size={20} />
                {language === 'ar' ? 'تحليل وإيجاد حلول' : 'Analyze & Find Solutions'}
             </button>
          </form>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative group flex items-center justify-center overflow-hidden transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] rounded-full p-2">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 opacity-80 animate-spin" />
              <div className="relative bg-navy rounded-full m-[2px] p-4 flex items-center justify-center">
                <Loader2 className="animate-spin text-red-400" size={40} />
              </div>
            </div>
            <p className="text-red-300 animate-pulse font-medium text-lg text-center max-w-xs mx-auto">
              {language === 'ar' ? 'جاري تقييم وضعك المالي والبحث عن أأمن الحلول...' : 'Evaluating your finances & finding safest solutions...'}
            </p>
          </div>
        )}

        {step === 'result' && report && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            
            <div className="bg-navy-light p-5 rounded-3xl border border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <HandPlatter size={24} className="text-red-400" />
                <h3 className="text-xl font-bold text-white">{language === 'ar' ? 'الخيارات المتاحة' : 'Available Options'}</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">{language === 'ar' ? 'مرتبة من الأفضل للأسوأ لضمان أقل ضرر مالي' : 'Ranked from best to worst to minimize financial impact'}</p>
              
              <div className="space-y-4">
                {report.options.map((opt: any, idx: number) => (
                  <div key={idx} className="bg-navy p-4 rounded-2xl border border-slate-700/50">
                    <div className="flex items-start gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${idx === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : idx < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                         {idx + 1}
                       </div>
                       <div>
                         <h4 className="font-bold text-white text-lg">{opt.title}</h4>
                         <p className="text-slate-300 text-sm mt-1">{opt.description}</p>
                         
                         <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-slate-800/50 rounded-xl p-3">
                               <div className="flex items-center gap-2 mb-1">
                                 <TrendingDown size={14} className="text-blue-400" />
                                 <span className="text-xs text-slate-400">{language === 'ar' ? 'الأثر المتوقع' : 'Expected Impact'}</span>
                               </div>
                               <p className="text-xs text-slate-200 font-medium">{opt.impactOnBalance}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-3">
                               <div className="flex items-center gap-2 mb-1">
                                 <Clock size={14} className="text-purple-400" />
                                 <span className="text-xs text-slate-400">{language === 'ar' ? 'فترة التعافي' : 'Recovery Time'}</span>
                               </div>
                               <p className="text-xs text-slate-200 font-medium">{opt.recoveryTime}</p>
                            </div>
                         </div>
                         
                         {opt.risk && (
                           <div className="mt-3 flex items-start gap-2 bg-red-900/10 p-2.5 rounded-lg border border-red-500/10">
                              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-200/80">{opt.risk}</p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 p-5 rounded-3xl border border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Activity size={24} className="text-green-400" />
                <h3 className="text-xl font-bold text-white">{language === 'ar' ? 'خطة التعافي' : 'Recovery Plan'}</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <div>
                     <span className="block text-sm font-bold text-green-300 mb-0.5">{language === 'ar' ? 'الخطة' : 'Plan'}</span>
                     <span className="text-sm text-slate-200">{report.recoveryPlan.plan}</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <div>
                     <span className="block text-sm font-bold text-green-300 mb-0.5">{language === 'ar' ? 'المدة' : 'Duration'}</span>
                     <span className="text-sm text-slate-200">{report.recoveryPlan.monthsToRecover} {language === 'ar' ? 'شهور' : 'months'}</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                     <span className="block text-sm font-bold text-blue-300 mb-0.5">{language === 'ar' ? 'الدرس المستفاد' : 'Lesson Learned'}</span>
                     <span className="text-sm text-slate-200">{report.recoveryPlan.lessonLearned}</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                  <div>
                     <span className="block text-sm font-bold text-purple-300 mb-0.5">{language === 'ar' ? 'نصيحة للمستقبل' : 'Future Advice'}</span>
                     <span className="text-sm text-slate-200">{report.recoveryPlan.nextTimeAdvice}</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <button onClick={() => setStep('input')} className="w-full bg-navy-light text-slate-300 font-bold py-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition">
              {language === 'ar' ? 'تحليل طارئ آخر' : 'Analyze another emergency'}
            </button>
            <button onClick={() => navigate('/')} className="w-full bg-navy text-teal font-bold py-4 rounded-xl hover:text-teal-400 transition">
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
