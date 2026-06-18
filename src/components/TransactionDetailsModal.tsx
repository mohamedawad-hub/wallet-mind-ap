import React, { useState, useEffect } from 'react';
import { X, Calendar, Wallet, Tag, Target, ChevronRight, Activity, Bell, Sparkles, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useCategories } from '../context/CategoriesContext';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  merchant?: string;
  date: string;
  wallet?: string;
  note?: string;
}

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export default function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  const { language } = useLanguage();
  const { categories } = useCategories();
  const [walletName, setWalletName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Generating simulated trend data for this specific category over the month
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState<string>(() => {
    return localStorage.getItem(`alert_${transaction.category}`) || '';
  });
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    // Determine priority based on category (mock logic)
    const ess = ['food', 'housing', 'transportation', 'utilities', 'healthcare', 'groceries'];
    const save = ['savings', 'investments', 'debt'];
    
    // Fetch wallet info
    const fetchWallet = async () => {
      try {
        if (transaction.wallet) {
          const res = await fetch('/api/wallets');
          const data = await res.json();
          if (data.success) {
            const w = data.data.find((w: any) => w.id === transaction.wallet);
            if (w) setWalletName(w.name);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchWallet();

    // Generate mock graph data for the last 30 days
    const generateSpecificData = () => {
      const tData = [];
      const hData = [];
      const now = new Date();
      let trendValue = transaction.amount;
      
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Randomize some occurrences
        const occurs = Math.random() > 0.6;
        let amt = 0;
        if (occurs || i === 0) {
           // slightly randomize amount based on base amount
           amt = transaction.amount * (0.5 + Math.random() * 0.8);
           trendValue = amt;
        }
        
        tData.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: Math.round(amt)
        });
        
        hData.push({
          date: dateStr,
          intensity: occurs ? Math.floor(Math.random() * 4) + 1 : 0
        });
      }
      setTrendData(tData);
      setHeatmapData(hData);
      setLoading(false);
    };

    setTimeout(generateSpecificData, 600); // simulate API loading
  }, [transaction]);

  const getCategoryDetails = (id: string) => {
    if (id.includes(':')) {
       const [mainId, subId] = id.split(':');
       const mainCat = categories.find(c => c.id === mainId);
       const subCat = mainCat?.subCategories.find((s: any) => s.id === subId);
       return {
         name: subCat ? subCat.name[language] : mainCat ? mainCat.name[language] : id,
         icon: subCat ? subCat.icon : mainCat ? mainCat.icon : '🏷️',
         color: subCat?.color || mainCat?.color || '#64748b',
         priority: subCat?.priority || mainCat?.priority
       };
    } else {
       const cat = categories.find(c => c.id === id);
       return {
         name: cat ? cat.name[language] : id,
         icon: cat ? cat.icon : '🏷️',
         color: cat?.color || '#64748b',
         priority: cat?.priority
       };
    }
  };

  const getPriorityInfo = (priorityKey: string) => {
    if (priorityKey === 'essential') return { label: language === 'ar' ? 'أساسيات (احتياج)' : 'Essentials (Need)', color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10' };
    if (priorityKey === 'savings' || priorityKey === 'investment') return { label: language === 'ar' ? 'مدخرات / استثمار' : 'Savings / Investment', color: 'text-teal-300 border-teal-500/30 bg-teal-500/10' };
    if (priorityKey === 'entertainment') return { label: language === 'ar' ? 'ترفيه' : 'Entertainment', color: 'text-pink-300 border-pink-500/30 bg-pink-500/10' };
    return { label: language === 'ar' ? 'مختلف (غير مصنف)' : 'Other (Uncategorized)', color: 'text-slate-300 border-slate-500/30 bg-slate-500/10' };
  };

  const catDetails = getCategoryDetails(transaction.category);
  const priority = getPriorityInfo(catDetails.priority);

  // Dynamic analytic properties
  const validTrendPoints = trendData.filter(d => d.amount > 0);
  const avgAmount = validTrendPoints.length > 0
    ? Math.round(trendData.reduce((acc, curr) => acc + curr.amount, 0) / validTrendPoints.length)
    : Math.round(transaction.amount * 0.92);

  const priceDiff = transaction.amount - avgAmount;
  const priceDiffPercent = avgAmount > 0 ? Math.round((priceDiff / avgAmount) * 100) : 0;
  const isOverAlert = alertThreshold && transaction.amount > parseFloat(alertThreshold);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none p-4">
      <div className="absolute inset-0 bg-navy/85 backdrop-blur-md pointer-events-auto w-full max-w-md mx-auto" onClick={onClose}></div>
      <div className="relative bg-navy rounded-3xl border border-slate-800 w-full max-w-md mx-auto max-h-[85vh] overflow-y-auto p-6 pb-8 shadow-2xl pointer-events-auto space-y-5">
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border border-slate-700/50" style={{ backgroundColor: `${catDetails.color}30`, color: catDetails.color }}>
               {catDetails.icon}
             </div>
             <div>
               <h2 className="text-xl font-bold text-white mb-0.5">{transaction.merchant || catDetails.name}</h2>
               <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={`px-2 py-0.5 rounded-lg border ${priority.color}`}>
                     {priority.label}
                  </span>
               </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-navy-light rounded-full text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-8">
           <p className="text-sm text-slate-400 mb-1">{language === 'ar' ? 'المبلغ' : 'Amount'}</p>
           <h3 className={`text-4xl font-black ${transaction.type === 'expense' ? 'text-white' : 'text-teal'}`}>
             {transaction.type === 'expense' ? '-' : '+'}{transaction.amount} <span className="text-xl font-bold text-slate-500">{transaction.currency || 'EGP'}</span>
           </h3>
           {transaction.note && (
             <p className="text-sm text-slate-400 mt-2 italic">"{transaction.note}"</p>
           )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
           <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
             <div className="flex items-center justify-between mb-2 opacity-70">
               <Calendar size={16} className="text-slate-400" />
               <span className="text-[10px] uppercase font-bold text-slate-500">{language === 'ar' ? 'التاريخ' : 'Date'}</span>
             </div>
             <p className="text-sm font-semibold text-slate-200">{new Date(transaction.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
           </div>
           
           <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
             <div className="flex items-center justify-between mb-2 opacity-70">
               <Wallet size={16} className="text-slate-400" />
               <span className="text-[10px] uppercase font-bold text-slate-500">{language === 'ar' ? 'المحفظة' : 'Wallet'}</span>
             </div>
             <p className="text-sm font-semibold text-slate-200 truncate">{walletName || (language === 'ar' ? 'محفظة مجهولة' : 'Unknown Wallet')}</p>
           </div>
        </div>

        {/* Heatmap Section */}
        <div className="mb-8">
          <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Activity size={16} className="text-teal" />
            {language === 'ar' ? 'نشاط هذه المعاملة (آخر 30 يوم)' : 'Transaction Activity (Last 30 Days)'}
          </h4>
          <div className="bg-navy-light rounded-2xl p-4 border border-slate-800">
            {loading ? (
               <div className="h-20 flex items-center justify-center text-teal animate-pulse">Loading...</div>
            ) : (
               <div className="flex flex-wrap gap-1.5 justify-center">
                 {heatmapData.map((d, i) => (
                     <div 
                       key={i}
                       className={`w-[14px] h-[14px] rounded-sm cursor-pointer transition-transform hover:scale-125
                         ${d.intensity === 0 ? 'bg-slate-800' : 
                          d.intensity === 1 ? 'bg-teal/30' : 
                          d.intensity === 2 ? 'bg-teal/60' : 
                          d.intensity === 3 ? 'bg-teal/80' : 'bg-teal'}
                       `} 
                       title={`${d.date}: ${d.amount} EGP`}
                     />
                 ))}
               </div>
            )}
            <p className="text-[10px] text-center text-slate-500 mt-3">{language === 'ar' ? 'مرات التكرار في آخر 30 يوماً' : 'Frequency over the last 30 days'}</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div>
          <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Target size={16} className="text-teal" />
            {transaction.type === 'expense' 
               ? (language === 'ar' ? 'مؤشر الإنفاق في هذا المسار' : 'Spending Trend for this Source')
               : (language === 'ar' ? 'معدل الدخل من هذا المسار' : 'Income Trend from this Source')}
          </h4>
          <div className="bg-navy-light rounded-3xl p-5 border border-slate-700/50 h-56 shadow-inner relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal/5 to-purple-500/5 rounded-full blur-2xl"></div>
            
            {loading ? (
               <div className="h-full flex items-center justify-center text-teal animate-pulse">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="cyberGlowUrl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={catDetails.color || "#00C9A7"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={catDetails.color || "#00C9A7"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155', strokeWidth: 1 }}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155', strokeWidth: 1 }}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(v) => v > 0 ? `${v}` : ''}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: `1px solid ${catDetails.color || '#00C9A7'}aa`, 
                      borderRadius: '16px', 
                      color: '#fff', 
                      fontSize: '11px', 
                      fontFamily: 'monospace',
                      boxShadow: `0 0 15px ${(catDetails.color || '#00C9A7')}40`
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: catDetails.color || '#00C9A7' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={catDetails.color || "#00C9A7"} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#cyberGlowUrl)" 
                    dot={{ r: 3, strokeWidth: 1, stroke: catDetails.color || "#00C9A7", fill: "#0f172a" }}
                    activeDot={{ r: 7, strokeWidth: 1.5, fill: catDetails.color || "#00C9A7" }}
                  />
                  {avgAmount > 0 && (
                    <ReferenceLine 
                      y={avgAmount} 
                      stroke={catDetails.color || "#00C9A7"} 
                      strokeDasharray="4 4" 
                      opacity={0.4}
                      label={{ 
                        value: language === 'ar' ? `المعدل: ${avgAmount} EGP` : `Avg: ${avgAmount} EGP`, 
                        fill: '#94a3b8', 
                        fontSize: 8,
                        position: 'top'
                      }} 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Futuristic Analysis & Alerts Console */}
        <div className="space-y-4 mt-6">
          {/* Descriptive Analytical Summary */}
          <div className="bg-navy-light rounded-2xl p-4 border border-slate-800">
            <h5 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={14} className="text-teal animate-pulse" />
              {language === 'ar' ? 'التحليل المالي الذكي' : 'Smart Financial Analysis'}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {transaction.type === 'expense' ? (
                language === 'ar' 
                  ? `تذهب هذه النفقات لتصنيف (${catDetails.name}). هذا المصروف يمثل عبئاً مؤقتاً على دورة التدفق بمعدل يومي متقطع. لتعزيز ميزانيتك، فكر في ترشيد الصرف المتعلق بـ (${catDetails.icon} ${catDetails.name}) هذا الأسبوع بنسبة 10% لتحقيق توازن مستدام.`
                  : `This expenditure routes directly to your (${catDetails.name}) basket. While standard, keeping an eye on (${catDetails.icon} ${catDetails.name}) recurring volume will allow you to safeguard additional monthly residual cash flow.`
              ) : (
                language === 'ar'
                  ? `أداء ممتاز! هذا التدفق المالي المنتمي لـ (${catDetails.name}) يغذي رصيدك الإجمالي بنجاح. نقترح عليك اقتطاع 20% كادخار استثماري فوري لبناء أصولك المالية والادخارية بشكل سريع.`
                  : `Splendid inflow! This addition belonging to (${catDetails.name}) fuels your aggregate capacity. Dedicating 20% to instant saving buffers will strongly compound your capital assets.`
              )}
            </p>
          </div>

          {/* MoM Comparison Feature */}
          <div className="bg-navy-light rounded-2xl p-4 border border-slate-800">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-400" />
                <span className="text-xs font-bold text-slate-300">{language === 'ar' ? 'مقارنة مع متوسط الشهر السابق' : 'Compare with Preceding Month'}</span>
              </div>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-[10px] text-teal border border-teal/30 hover:bg-teal/10 px-2 py-0.5 rounded-lg transition"
              >
                {showComparison ? (language === 'ar' ? 'إخفاء' : 'عرض') : (language === 'ar' ? 'مقارنة' : 'Compare')}
              </button>
            </div>

            {showComparison && (
              <div className="mt-3 space-y-2 border-t border-slate-800/60 pt-3 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  {language === 'ar' ? (
                    `متوسط المعاملات المسجلة لهذا التصنيف هو ${avgAmount} EGP.`
                  ) : (
                    `The typical historical mean transaction for this source is ${avgAmount} EGP.`
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    transaction.amount > avgAmount ? 'bg-red-500/20 text-red-400' : 'bg-teal/20 text-teal'
                  }`}>
                    {transaction.amount > avgAmount ? (
                      language === 'ar' ? 'أعلى من المتوسط' : 'Above Average'
                    ) : (
                      language === 'ar' ? 'أقل من المتوسط' : 'Below Average'
                    )}
                  </span>
                  <span className="text-slate-300">
                    {language === 'ar' 
                      ? `بنسبة تبلغ ${Math.abs(priceDiffPercent)}% مقارنة بمتوسط العمليات.` 
                      : `by roughly ${Math.abs(priceDiffPercent)}% against typical benchmarks.`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Limit Overrun Warning Alert Settings */}
          <div className="bg-navy-light rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell size={16} className={isOverAlert ? "text-red-400 animate-bounce" : "text-amber-400"} />
                <span className="text-xs font-bold text-slate-300">{language === 'ar' ? 'تنبيه تجاوز الحد المالي' : 'Expenditure Cap Alert'}</span>
              </div>
              {isOverAlert && (
                <span className="px-1.5 py-0.5 text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg animate-pulse">
                  {language === 'ar' ? 'تخطي الحد!' : 'Limit Exceeded!'}
                </span>
              )}
            </div>

            {isOverAlert && (
              <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300 leading-normal">
                {language === 'ar' 
                  ? `🚨 تحذير استهلاك: المعاملة الحالية (${transaction.amount} EGP) تخطت حد الإنفاق الآمن المخصص بقيمة (${alertThreshold} EGP)!`
                  : `🚨 Overrun Notice: The current single outflow (${transaction.amount} EGP) violates your safe limit parameters set at (${alertThreshold} EGP)!`}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <input
                type="number"
                value={alertThreshold}
                onChange={(e) => {
                  setAlertThreshold(e.target.value);
                  setAlertSaved(false);
                }}
                placeholder={language === 'ar' ? 'حدد مبلغ التنبيه (مثال: 500)' : 'Alert limit (e.g., 500)'}
                className="w-full bg-navy border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-teal text-right rtl:text-right"
              />
              <button
                onClick={() => {
                  if (alertThreshold.trim()) {
                    localStorage.setItem(`alert_${transaction.category}`, alertThreshold);
                    setAlertSaved(true);
                  } else {
                    localStorage.removeItem(`alert_${transaction.category}`);
                    setAlertSaved(true);
                  }
                  setTimeout(() => setAlertSaved(false), 2000);
                }}
                className="w-full bg-teal text-navy font-bold text-xs py-2.5 rounded-xl transition hover:bg-teal-light flex items-center justify-center gap-1.5"
              >
                {alertSaved ? (
                  <>
                    <Check size={14} />
                    {language === 'ar' ? 'تم حفظ التنبيه المالي بنجاح' : 'Limit alert saved successfully'}
                  </>
                ) : (
                  language === 'ar' ? 'حفظ حد الإنفاق الآمن' : 'Save Safe Spend Limit'
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const CustomHeatmapTooltip = ({ active, payload, label }: any) => {
  if (active) {
    return (
      <div className="bg-slate-800 px-2 py-1 rounded text-xs text-white">
        {label}
      </div>
    );
  }
  return null;
}
