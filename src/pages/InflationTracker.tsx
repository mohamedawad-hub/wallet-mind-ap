import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, Activity, Loader2, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function InflationTracker() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inflation/analyze', { method: 'POST' })
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full bg-navy relative">
      {/* Header */}
      <div className="flex items-center px-6 py-5 border-b border-navy-light/50 bg-navy z-10 sticky top-0">
        <button onClick={() => navigate('/stats')} className="mr-4 text-slate-400 hover:text-white transition">
           {language === 'ar' ? <ArrowLeft size={24} className="rotate-180" /> : <ArrowLeft size={24} />}
        </button>
        <h2 className="text-xl font-bold text-white tracking-wide">
          {language === 'ar' ? 'مقارنة الأسعار الزمنية (التضخم)' : 'Price Timeline & Inflation'}
        </h2>
      </div>

      <div className="p-6 overflow-y-auto pb-32 space-y-6">
        
        <div className="bg-gradient-to-br from-red-900/40 to-slate-900 border border-red-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
           <TrendingUp size={24} className="text-red-400 mb-2" />
           <p className="text-sm font-medium text-slate-300 mb-1">
             {language === 'ar' ? 'أثر التضخم على أسلوب حياتك' : 'Inflation Impact on Your Lifestyle'}
           </p>
           <p className="text-xs text-slate-400">
             {language === 'ar' 
               ? 'بنقارن مصاريفك الثابتة والمتكررة عشان نوريك أسعارك الحقيقية بتتغير إزاي' 
               : 'We compare your fixed and recurring expenses to show how your real prices are changing'}
           </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-70">
            <Loader2 size={40} className="text-red-400 animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-300 animate-pulse">
              {language === 'ar' ? 'جاري تحليل تاريخ معاملاتك وتأثير التضخم...' : 'Analyzing transaction history & inflation impact...'}
            </p>
          </div>
        ) : !data ? (
          <div className="text-center py-10 text-slate-500">
            <Info size={40} className="mx-auto mb-2 opacity-50" />
            <p>{language === 'ar' ? 'ليس لديك بيانات كافية لتحليل التضخم' : 'Not enough data to analyze inflation'}</p>
          </div>
        ) : (
          <>
            {/* Insights */}
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-white mb-2">{language === 'ar' ? 'ملاحظات الذكاء الاصطناعي' : 'AI Insights'}</h3>
               {data.insights.map((insight: any, i: number) => (
                 <div key={i} className={`bg-navy-light rounded-2xl p-4 border relative overflow-hidden group ${
                     insight.type === 'alert' ? 'border-amber-500/30 bg-amber-500/5' : 
                     insight.type === 'impact' ? 'border-red-500/30 bg-red-500/5' : 
                     'border-slate-700'
                 }`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          {insight.type === 'alert' && <AlertTriangle size={20} className="text-amber-400" />}
                          {insight.type === 'impact' && <Activity size={20} className="text-red-500" />}
                          {insight.type === 'trend' && <TrendingUp size={20} className="text-teal" />}
                          <h4 className="font-bold text-white text-sm">
                             {language === 'ar' ? insight.title_ar : insight.title_en}
                          </h4>
                       </div>
                       {insight.percentageIncrease > 0 && (
                         <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold font-mono">
                           +{insight.percentageIncrease}%
                         </div>
                       )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                       {language === 'ar' ? insight.description_ar : insight.description_en}
                    </p>
                 </div>
               ))}
            </div>

            {/* Charts */}
            <div className="space-y-6 mt-8">
               <h3 className="text-lg font-bold text-white mb-2">{language === 'ar' ? 'تاريخ أسعار مشترياتك' : 'Price History'}</h3>
               {data.chartData.map((chart: any, i: number) => {
                 // Sort history by date to avoid rechart glitches
                 const sortedData = [...chart.history].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                 
                 return (
                 <div key={i} className="bg-navy-light rounded-2xl border border-slate-700/50 p-5">
                   <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-400"></div>
                     {chart.merchant}
                   </h4>
                   <div className="h-48 w-full mt-2">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={sortedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                         <defs>
                           <linearGradient id={`colorPrice_${i}`} x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                             <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                           </linearGradient>
                         </defs>
                         <XAxis 
                           dataKey="date" 
                           stroke="#475569" 
                           fontSize={10} 
                           tickMargin={10} 
                           tickFormatter={(val) => new Date(val).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: '2-digit' })}
                         />
                         <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => val.toLocaleString()} />
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                           itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                           labelFormatter={(label) => new Date(label as string).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium' })}
                           formatter={(value: any) => [`${value} EGP`, language === 'ar' ? 'السعر' : 'Price']}
                         />
                         <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill={`url(#colorPrice_${i})`} />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               )})}
            </div>
            
          </>
        )}
      </div>
    </div>
  );
}
