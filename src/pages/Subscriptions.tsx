import React, { useState } from 'react';
import { RefreshCw, Plus, Calendar, CreditCard, ChevronLeft, Trash2, ArrowLeft, Ghost, AlertTriangle, TrendingDown, Loader2, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function Subscriptions() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  // Mock data for subscriptions
  const [subs, setSubs] = useState([
    { id: '1', name: 'Netflix', amount: 120, currency: 'EGP', cycle: 'monthly', nexDate: '2026-07-01', color: '#E50914' },
    { id: '2', name: 'Spotify', amount: 50, currency: 'EGP', cycle: 'monthly', nexDate: '2026-06-25', color: '#1DB954' },
    { id: '3', name: 'Amazon Prime', amount: 290, currency: 'EGP', cycle: 'yearly', nexDate: '2026-11-15', color: '#00A8E1' },
    { id: '4', name: 'Gym Membership', amount: 450, currency: 'EGP', cycle: 'monthly', nexDate: '2026-06-28', color: '#8b5cf6' },
  ]);

  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any>(null);

  const totalMonthly = subs.reduce((acc, s) => acc + (s.cycle === 'monthly' ? s.amount : s.amount / 12), 0);

  const deleteSub = (id: string) => {
    setSubs(subs.filter(s => s.id !== id));
  };

  const runAnalysis = async () => {
    setShowAnalyzer(true);
    setAnalyzing(true);
    try {
      const res = await fetch('/api/subscription-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: subs })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-navy-light/50 bg-navy z-10 sticky top-0">
        <div className="flex items-center">
          <button onClick={() => navigate('/profile')} className="mr-4 text-slate-400 hover:text-white transition">
             {language === 'ar' ? <ArrowLeft size={24} className="rotate-180" /> : <ArrowLeft size={24} />}
          </button>
          <h2 className="text-xl font-bold text-white tracking-wide">{language === 'ar' ? 'الاشتراكات' : 'Subscriptions'}</h2>
        </div>
      </div>

      <div className="p-6 overflow-y-auto pb-32">
        
        {/* Zombie Catcher Trigger */}
        <button 
          onClick={runAnalysis}
          className="w-full bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 border border-fuchsia-500/30 rounded-3xl p-4 mb-6 flex flex-row items-center justify-between group hover:border-fuchsia-400/50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
          <div className="flex items-center gap-4">
             <div className="bg-fuchsia-500/20 p-3 rounded-2xl text-fuchsia-400 group-hover:scale-110 transition-transform">
                <Ghost size={24} />
             </div>
             <div className="text-left rtl:text-right">
                <h3 className="text-fuchsia-100 font-bold">{language === 'ar' ? 'اكتشف الاشتراكات الزومبي' : 'Catch Zombie Subscriptions'}</h3>
                <p className="text-sm text-fuchsia-300/70">{language === 'ar' ? 'تحليل ذكي لمعرفة الفلوس اللي بتضيع بدون وعي' : 'Smart analysis to stop money bleeding'}</p>
             </div>
          </div>
          <Sparkles size={20} className="text-fuchsia-500 opacity-50 group-hover:opacity-100 animate-pulse" />
        </button>

        <div className="bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 mb-8 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
           <p className="text-sm font-medium text-indigo-200/70 mb-1">{language === 'ar' ? 'إجمالي الدفع الشهري' : 'Total Monthly Cost'}</p>
           <h3 className="text-4xl font-black text-white">{Math.round(totalMonthly)} <span className="text-xl text-indigo-300 font-bold">EGP</span></h3>
        </div>

        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-slate-200">{language === 'ar' ? 'اشتراكاتي' : 'My Subscriptions'}</h3>
           <button onClick={() => setShowAdd(!showAdd)} className="text-amber-500 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition">
             <Plus size={20} />
           </button>
        </div>

        {showAdd && (
           <div className="bg-navy-light border border-slate-700/50 p-4 rounded-3xl mb-6 animate-[slideDown_0.3s_ease-out]">
              <h4 className="font-bold text-white mb-4">{language === 'ar' ? 'إضافة اشتراك جديد' : 'New Subscription'}</h4>
              <div className="space-y-3">
                 <input type="text" placeholder={language === 'ar' ? 'اسم الخدمة (مثال: Netflix)' : 'Service Name (e.g. Netflix)'} className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 outline-none focus:border-teal text-sm" />
                 <div className="flex gap-2">
                    <input type="number" placeholder={language === 'ar' ? 'المبلغ' : 'Amount'} className="flex-1 bg-slate-800 text-white p-3 rounded-xl border border-slate-700 outline-none focus:border-teal text-sm" />
                    <select className="bg-slate-800 text-white p-3 rounded-xl border border-slate-700 outline-none text-sm">
                       <option value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</option>
                       <option value="yearly">{language === 'ar' ? 'سنوي' : 'Yearly'}</option>
                    </select>
                 </div>
                 <input type="date" className="w-full bg-slate-800 text-white p-3 rounded-xl border border-slate-700 outline-none text-sm" />
                 <button onClick={() => setShowAdd(false)} className="w-full bg-teal text-navy-dark font-bold p-3 rounded-xl flex items-center justify-center hover:bg-teal/90">{language === 'ar' ? 'حفظ' : 'Save'}</button>
              </div>
           </div>
        )}

        <div className="space-y-4">
          {subs.map(sub => (
            <div key={sub.id} className="bg-navy-light p-4 rounded-3xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shadow-inner" style={{ backgroundColor: sub.color }}>
                   {sub.name.charAt(0)}
                 </div>
                 <div>
                    <h4 className="font-bold text-white">{sub.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar size={12} /> {language === 'ar' ? 'التجديد:' : 'Renews:'} {sub.nexDate}
                    </p>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className="font-bold text-white">{sub.amount} <span className="text-xs text-slate-400">{sub.cycle === 'monthly' ? '/mo' : '/yr'}</span></div>
                 <button onClick={() => deleteSub(sub.id)} className="text-slate-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))}
          {subs.length === 0 && <p className="text-center text-sm text-slate-500">{language === 'ar' ? 'لا توجد اشتراكات' : 'No subscriptions'}</p>}
        </div>
      </div>

      {/* Analyzer Modal */}
      {showAnalyzer && (
        <div className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-gradient-to-b from-navy to-navy-dark w-full max-w-lg rounded-[2rem] border border-fuchsia-500/30 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-navy-light/50">
              <div className="flex items-center gap-3">
                 <Ghost size={24} className="text-fuchsia-400" />
                 <h3 className="text-lg font-bold text-white">{language === 'ar' ? 'تقرير الزومبي 🧟‍♂️' : 'Zombie Report 🧟‍♂️'}</h3>
              </div>
              <button onClick={() => setShowAnalyzer(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 relative">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-fuchsia-400" size={40} />
                  <p className="text-fuchsia-300 animate-pulse font-medium">
                    {language === 'ar' ? 'جاري اصطياد الاشتراكات المنسية...' : 'Hunting forgotten subscriptions...'}
                  </p>
                </div>
              ) : analysisReport ? (
                <div className="space-y-6 animate-[slideUp_0.4s_ease-out]">
                  {/* Savings Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="bg-navy-light border border-slate-700/50 rounded-2xl p-4 text-center">
                       <p className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'إجمالي شهري' : 'Total Monthly'}</p>
                       <h4 className="text-2xl font-bold text-white">{analysisReport.totalMonthly}</h4>
                     </div>
                     <div className="bg-navy-light border border-slate-700/50 rounded-2xl p-4 text-center">
                       <p className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'إجمالي سنوي' : 'Total Yearly'}</p>
                       <h4 className="text-2xl font-bold text-white">{analysisReport.totalYearly}</h4>
                     </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/30 rounded-3xl p-5 text-center">
                    <TrendingDown size={32} className="text-green-400 mx-auto mb-2" />
                    <p className="text-green-300 font-bold mb-1">{language === 'ar' ? 'ممكن توفر شهرياً' : 'Potential Monthly Savings'}</p>
                    <h4 className="text-4xl font-black text-white mb-2">{analysisReport.potentialSavingsMonthly} <span className="text-lg text-green-400 font-bold">EGP</span></h4>
                    <p className="text-sm text-green-200/70 bg-green-900/40 p-3 rounded-xl">{analysisReport.savingsMessage}</p>
                  </div>

                  {/* Analyzed Subs List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-200 mb-2">{language === 'ar' ? 'التحليل بالتفصيل' : 'Detailed Analysis'}</h4>
                    {analysisReport.analyzedSubs.map((sub: any, idx: number) => {
                      const isZombie = sub.category === 'زومبي' || sub.category === 'Zombie';
                      return (
                        <div key={idx} className={`p-4 rounded-2xl border ${isZombie ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                          <div className="flex justify-between items-start mb-2">
                             <div>
                               <h5 className="font-bold text-white flex items-center gap-2">
                                 {sub.name}
                                 {isZombie && <AlertTriangle size={14} className="text-red-400" />}
                               </h5>
                               <p className="text-xs text-slate-400">{sub.usageEstimate}</p>
                             </div>
                             <div className="text-right">
                               <div className="font-bold text-white">{sub.originalAmount} EGP</div>
                               <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${isZombie ? 'bg-red-500/20 text-red-300' : 'bg-teal/20 text-teal'}`}>
                                 {sub.category}
                               </div>
                             </div>
                          </div>
                          
                          <div className="mt-3 text-sm bg-navy/50 p-3 rounded-xl text-slate-300">
                             <p><span className="font-bold text-fuchsia-300">🤖 {language === 'ar' ? 'رأيي:' : 'AI:'}</span> {sub.recommendation}</p>
                             {sub.alternative && (
                               <p className="mt-1"><span className="font-bold text-amber-300">💡 {language === 'ar' ? 'البديل:' : 'Alternative:'}</span> {sub.alternative}</p>
                             )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                 <div className="text-center text-slate-500 py-10">
                   {language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Error occurred. Try again.'}
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
