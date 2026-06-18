import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useCategories, Category, SubCategory } from "../context/CategoriesContext";
import { useLanguage } from "../context/LanguageContext";

import TransactionDetailsModal from "../components/TransactionDetailsModal";
import HiddenPatterns from "../components/HiddenPatterns";

export default function Dashboard() {
  const { categories } = useCategories();
  const { language, t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [whatIfValue, setWhatIfValue] = useState('');
  const [whatIfResult, setWhatIfResult] = useState<number | null>(null);
  const [undoToast, setUndoToast] = useState<{ id: string, name: string } | null>(null);
  const [undoTimer, setUndoTimer] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const handleDelete = (id: string, name: string) => {
     // visually hide it immediately but wait to actually delete
     const newTxs = data.recentTransactions.filter((t: any) => t.id !== id);
     setData({ ...data, recentTransactions: newTxs });

     if (undoTimer) clearTimeout(undoTimer);
     setUndoToast({ id, name });

     const timer = setTimeout(() => {
        // Here we would call the actual deletion API
        // fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        setUndoToast(null);
     }, 4000);
     setUndoTimer(timer);
  };

  const handleUndo = () => {
     if(undoTimer) clearTimeout(undoTimer);
     setUndoToast(null);
     fetchDashboard(); // reaload original
  };

  const getPriorityLabel = (priority?: string) => {
    if (!priority) return null;
    switch (priority) {
      case 'essential': return language === 'ar' ? 'أساسية' : 'Essential';
      case 'entertainment': return language === 'ar' ? 'ترفيهية' : 'Entertainment';
      case 'investment': return language === 'ar' ? 'إستثمار' : 'Investment';
      default: return language === 'ar' ? 'أخرى' : 'Other';
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDetails = (id: string) => {
    if (id.includes(':')) {
       const [mainId, subId] = id.split(':');
       const mainCat = categories.find(c => c.id === mainId);
       const subCat = mainCat?.subCategories.find(s => s.id === subId);
       return {
         name: subCat ? subCat.name[language] : mainCat ? mainCat.name[language] : id,
         icon: subCat ? subCat.icon : mainCat ? mainCat.icon : '🏷️',
         priority: subCat?.priority || mainCat?.priority
       };
    } else {
       const cat = categories.find(c => c.id === id);
       return {
         name: cat ? cat.name[language] : id,
         icon: cat ? cat.icon : '🏷️',
         priority: cat?.priority
       };
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-teal animate-pulse">
        <Activity size={32} />
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-6 text-center text-slate-400">
        Failed to load dashboard data.
      </div>
    );

  const totalBalance = data.netWorth;

  // Custom colors for Donut Chart
  const COLORS = ["#00C9A7", "#FFD166", "#EF476F", "#118AB2", "#073B4C"];

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto pb-32">
      {/* NET WORTH CARD */}
      <div className="bg-gradient-to-br from-navy-light to-navy rounded-3xl p-6 shadow-lg border border-teal/10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal/10 rounded-full blur-3xl"></div>
        <p className="text-slate-400 text-sm font-medium mb-1 relative z-10">
          {t('total_net_worth')}
        </p>
        <h2 className="text-4xl font-bold text-white relative z-10 mb-2">
          {totalBalance.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}{" "}
          <span className="text-xl font-bold text-slate-400">
            {language === 'ar' ? 'ج.م' : 'EGP'}
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm relative z-10">
          <span className="flex items-center text-teal bg-teal/10 px-2 py-0.5 rounded-full font-medium">
            <ArrowUpRight size={14} className="mr-1 rtl:ml-1 rtl:mr-0" />{" "}
            {language === 'ar' ? '١٢٠.٥٠ ج.م' : '120.50 EGP'} (2.4%)
          </span>
          <span className="text-slate-500">{t('vs_last_month')}</span>
        </div>
      </div>

      {/* MONTHLY SPENDING TREND DELTA */}
      {data?.monthlyTrend && (
        <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              {language === 'ar' ? 'مقارنة الإنفاق والوفر الشهري' : 'Monthly Spending MoM Trend'}
            </h3>
            <span className="text-[10px] text-slate-400 bg-navy px-2.5 py-0.5 rounded-full font-mono">
              {data.monthlyTrend.previousMonthName} ➔ {data.monthlyTrend.currentMonthName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-navy/40 p-4 rounded-2xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-1">
                {language === 'ar' ? `إنفاق ${data.monthlyTrend.previousMonthName}` : `${data.monthlyTrend.previousMonthName} Spent`}
              </span>
              <span className="font-bold text-sm text-slate-300">
                {data.monthlyTrend.previousSpent.toLocaleString(undefined, { minimumFractionDigits: 1 })} EGP
              </span>
            </div>
            <div className="bg-navy/40 p-4 rounded-2xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block mb-1">
                {language === 'ar' ? `إنفاق ${data.monthlyTrend.currentMonthName}` : `${data.monthlyTrend.currentMonthName} Spent`}
              </span>
              <span className="font-bold text-sm text-white">
                {data.monthlyTrend.currentSpent.toLocaleString(undefined, { minimumFractionDigits: 1 })} EGP
              </span>
            </div>
          </div>

          <div className={[
            "p-3 rounded-2xl flex items-center justify-between",
            data.monthlyTrend.deltaAmount > 0 
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-teal-500/10 border border-teal-500/20 text-teal"
          ].join(' ')}>
            <div>
              <span className="text-[10px] text-slate-400 block">
                {language === 'ar' ? 'التغير في الإنفاق' : 'Spending Change'}
              </span>
              <span className="font-bold text-sm">
                {data.monthlyTrend.deltaAmount > 0 ? '+' : ''}
                {data.monthlyTrend.deltaAmount.toLocaleString(undefined, { minimumFractionDigits: 1 })} EGP
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">
                {language === 'ar' ? 'النسبة المئوية' : 'Percentage'}
              </span>
              <span className={["text-base font-extrabold flex items-center justify-end gap-1", data.monthlyTrend.deltaAmount > 0 ? 'text-red-400' : 'text-teal'].join(' ')}>
                {data.monthlyTrend.deltaAmount > 0 ? (
                  <ArrowUpRight size={18} className="text-red-400" />
                ) : (
                  <ArrowDownRight size={18} className="text-teal" />
                )}
                {Math.abs(data.monthlyTrend.deltaPercentage)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            {data.monthlyTrend.deltaAmount > 0 ? (
              language === 'ar' 
                ? `❌ لقد زاد إنفاقك هذا الشهر بمعدل ${Math.abs(data.monthlyTrend.deltaPercentage)}% عن الشهر الماضي. ركز على تقليص المصاريف الترفيهية لتأمين وفوراتك.`
                : `❌ Your spending increased by ${Math.abs(data.monthlyTrend.deltaPercentage)}% compared to last month. Watch your entertainment and shopping buffers.`
            ) : (
              language === 'ar'
                ? `✨ تحسن رائع! لقد وفرت ${Math.abs(data.monthlyTrend.deltaPercentage)}% من إنفاقك مقارنة بالشهر السابق. هذه الأموال مستعدة للبناء كأصول حقيقية.`
                : `✨ Splendid! You saved ${Math.abs(data.monthlyTrend.deltaPercentage)}% on spending compared to last month. Consider moving this savings into investments.`
            )}
          </p>
        </div>
      )}



      <HiddenPatterns />

      {/* WHAT IF CALCULATOR MINI-CARD */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute -right-5 -bottom-5 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
            <Activity size={16} />
            {language === 'ar' ? 'ماذا لو؟ (تجربة تأثير المصروف)' : 'What If? (Test Impact)'}
          </h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={whatIfValue}
            onChange={(e) => setWhatIfValue(e.target.value)}
            placeholder={language === 'ar' ? 'المبلغ...' : 'Amount...'} 
            className="bg-navy border border-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500 flex-1"
          />
          <button 
            onClick={() => {
              if(!whatIfValue) return;
              const val = parseFloat(whatIfValue);
              setWhatIfResult(totalBalance - val);
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl transition font-medium"
          >
            {language === 'ar' ? 'تجربة' : 'Test'}
          </button>
        </div>
        {whatIfResult !== null ? (
          <p className="text-sm font-medium mt-3 pt-3 border-t border-indigo-500/20 text-indigo-200">
            {language === 'ar' ? 'الرصيد المتوقع سيكون: ' : 'Expected balance: '}
            <span className="font-bold text-white">
              {whatIfResult.toLocaleString(undefined, {minimumFractionDigits: 2})}{" "}
              {language === 'ar' ? 'ج.م' : 'EGP'}
            </span>
            <button className="text-xs text-slate-400 ml-3 rtl:mr-3 underline" onClick={() => { setWhatIfResult(null); setWhatIfValue(''); }}>{language === 'ar' ? 'إعادة' : 'Reset'}</button>
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-2">
             {language === 'ar' ? 'أدخل مبلغاً لترى كيف سيؤثر على الرصيد المتوقع نهاية الشهر.' : 'Enter an amount to see its impact on month-end balance.'}
          </p>
        )}
      </div>

      {/* SPENDING DONUT CHART */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">{t('spending_overview')}</h3>
          <select className="bg-navy border border-slate-700 text-xs px-2 py-1 rounded-lg text-slate-300 outline-none">
            <option>{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
            <option>{language === 'ar' ? 'الشهر الماضي' : 'Last Month'}</option>
          </select>
        </div>
        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.spendingChart.map((e: any) => ({ ...e, displayName: getCategoryDetails(e.name).name }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                nameKey="displayName"
                stroke="none"
              >
                {data.spendingChart.map((entry: any, index: number) => (
                  <Cell
                    key={"cell-" + index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A2942",
                  borderColor: "#00C9A7",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400">
              {language === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent'}
            </span>
            <span className="text-lg font-bold text-white">
              {data.spendingChart
                .reduce((a: number, b: any) => a + (b.value || 0), 0)
                .toLocaleString()}{" "}
              EGP
            </span>
          </div>
        </div>

        {/* Detailed Category Legend Breakdowns */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {data.spendingChart.map((entry: any, index: number) => {
            const details = getCategoryDetails(entry.name);
            const totalSpent = data.spendingChart.reduce((a: number, b: any) => a + (b.value || 0), 0);
            const percent = totalSpent > 0 ? Math.round((entry.value / totalSpent) * 100) : 0;
            return (
              <div key={index} className="bg-navy p-2.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="truncate">{details.icon} {details.name}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className="text-white font-bold">{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP</span>
                  <span className="text-slate-400 font-mono text-[10px]">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CASH FLOW (INCOME VS EXPENSE) DONUT CHART */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">
            {language === 'ar' ? 'التدفقات المالية ومؤشر الوفر' : 'Cash Flow (In vs Out)'}
          </h3>
          <span className="text-[10px] bg-emerald-500/10 text-teal px-2.5 py-0.5 rounded-full font-bold">
            {language === 'ar' ? 'محدث تلقائياً' : 'Live State'}
          </span>
        </div>

        <div className="h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.cashFlowChart || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                <Cell fill="#00C9A7" />
                <Cell fill="#EF476F" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A2942",
                  borderColor: "#00C9A7",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value: any, name: string) => {
                  const label = name === 'Income' 
                    ? (language === 'ar' ? 'إجمالي الدخل الوارد' : 'Total Inflow') 
                    : (language === 'ar' ? 'إجمالي الإنفاق الصادر' : 'Total Outflow');
                  return [`${value.toLocaleString()} EGP`, label];
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Net Savings Status */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] text-slate-400">
              {language === 'ar' ? 'صافي الوفر الشهري' : 'Net Dynamic Surplus'}
            </span>
            <span className={`text-sm font-black ${(data.cashFlowChart?.[0]?.value - data.cashFlowChart?.[1]?.value) >= 0 ? "text-teal" : "text-rose-400"}`}>
              {((data.cashFlowChart?.[0]?.value || 0) - (data.cashFlowChart?.[1]?.value || 0)) >= 0 ? '+' : ''}
              {((data.cashFlowChart?.[0]?.value || 0) - (data.cashFlowChart?.[1]?.value || 0)).toLocaleString()}{" "}
              EGP
            </span>
          </div>
        </div>

        {/* Cash Flow Detailed breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <span className="w-2.5 h-2.5 bg-[#00C9A7] rounded-full"></span>
              {language === 'ar' ? 'الأموال الداخلة' : 'Money In (Income)'}
            </div>
            <div>
              <span className="text-white text-sm font-extrabold">
                {(data.cashFlowChart?.[0]?.value || 0).toLocaleString()} EGP
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'رواتب وحوافز استثمار' : 'Earnings & dividends'}
              </p>
            </div>
          </div>

          <div className="bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
              <span className="w-2.5 h-2.5 bg-[#EF476F] rounded-full"></span>
              {language === 'ar' ? 'الأموال الخارجة' : 'Money Out (Expenses)'}
            </div>
            <div>
              <span className="text-white text-sm font-extrabold">
                {(data.cashFlowChart?.[1]?.value || 0).toLocaleString()} EGP
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'مصاريف وفواتير مستحقة' : 'Inflow rent & charges'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS AS TIMELINE */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-200">{language === 'ar' ? 'الخط الزمني للعمليات' : 'Transactions Timeline'}</h3>
          <button
            onClick={fetchDashboard}
            className="text-xs text-teal flex items-center"
          >
            <RefreshCw size={12} className="mr-1 rtl:ml-1 rtl:mr-0" /> {t('refresh')}
          </button>
        </div>

        <div className="relative border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-700/50 pl-6 rtl:pl-0 rtl:pr-6 space-y-6">
          {data.recentTransactions.map((tx: any) => {
            const catDetails = getCategoryDetails(tx.category);
            return (
            <div
              key={tx.id}
              onClick={() => setSelectedTransaction(tx)}
              className="relative p-4 bg-navy-light rounded-2xl border border-slate-800/50 hover:bg-slate-800/30 transition-colors shadow-sm cursor-pointer group"
            >
              {/* Timeline Dot */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-[29px] rtl:-left-auto rtl:-right-[29px] w-4 h-4 rounded-full bg-navy border-2 border-teal"></div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center text-2xl bg-slate-800/30 rounded-full">
                    {catDetails.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-1">
                      {catDetails.name}
                      {catDetails.priority && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          catDetails.priority === 'essential' ? 'bg-indigo-500/20 text-indigo-300' :
                          catDetails.priority === 'entertainment' ? 'bg-pink-500/20 text-pink-300' :
                          catDetails.priority === 'investment' ? 'bg-teal-500/20 text-teal-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {getPriorityLabel(catDetails.priority)}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex gap-2">
                       <span>{tx.date}</span>
                       <span className="opacity-50">•</span>
                       <span>{tx.merchant || tx.note}</span>
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-right rtl:text-left ${tx.type === "expense" ? "text-white" : "text-teal"}`}>
                  {tx.type === "expense" ? "-" : "+"}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{" "}
                  <span className="text-xs font-semibold text-slate-400">
                    {language === 'ar' ? 'ج.م' : 'EGP'}
                  </span>
                  <div className="flex justify-end gap-1 mt-1">
                    {tx.type === "expense" ? <ArrowDownRight size={14} className="text-red-400" /> : <ArrowUpRight size={14} className="text-teal" />}
                  </div>
                </div>
              </div>
              {/* Delete button (hover only or absolute) */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(tx.id, catDetails.name); }}
                className="absolute top-2 right-2 rtl:left-2 rtl:right-auto text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
              >
                <div style={{ fontSize: '14px' }}>🗑</div>
              </button>
            </div>
          )})}
          {data.recentTransactions.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-4">
              {language === 'ar' ? 'لا توجد معاملات حديثة.' : 'No recent transactions.'}
            </p>
          )}
        </div>
      </div>

      {/* UNDO TOAST */}
      {undoToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-4 z-50 animate-[slideUp_0.3s_ease-out]">
          <span className="text-sm">
            {language === 'ar' ? `تم حذف "${undoToast.name}"` : `Deleted "${undoToast.name}"`}
          </span>
          <button 
            onClick={handleUndo}
            className="text-teal font-bold text-sm hover:underline"
          >
            {language === 'ar' ? 'تراجع' : 'Undo'}
          </button>
        </div>
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
