import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCategories, Category, SubCategory } from '../context/CategoriesContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import { Target, TrendingUp, Brain, Zap, Map, Filter, Calendar, ArrowUpRight, ArrowDownLeft, Search, ListFilter, SlidersHorizontal, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MoneyJourneyView from '../components/MoneyJourneyView';
import AIForecastView from '../components/AIForecastView';
import TransactionDetailsModal from '../components/TransactionDetailsModal';

export default function Statistics() {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [conscienceReport, setConscienceReport] = useState<any>(null);
  const [mode, setMode] = useState<'basic' | 'journey' | 'forecast' | 'history'>('basic');
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all', '01' - '12'
  const [selectedDay, setSelectedDay] = useState('all'); // 'all', '1' - '31'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const fetchTransactionsList = async () => {
    try {
      const res = await fetch('/api/transactions');
      const json = await res.json();
      if (json.success) {
        setAllTransactions(json.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    }
  };

  useEffect(() => {
    // Mock fetch for stats data
    const fetchStats = async () => {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if(json.success) setData(json.data);
    };
    
    const fetchGoals = async () => {
      try {
        const res = await fetch('/api/goals');
        const json = await res.json();
        if(json.success) setGoals(json.data || []);
      } catch (e) {
        console.error(e);
      }
    };

    const fetchConscience = async () => {
      try {
        const res = await fetch('/api/conscious-decisions/report');
        const json = await res.json();
        if(json.success) setConscienceReport(json.data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();
    fetchGoals();
    fetchConscience();
    fetchTransactionsList();
  }, []);

  const getCategoryDetails = (id: string) => {
    if (id.includes(':')) {
       const [mainId, subId] = id.split(':');
       const mainCat = categories.find(c => c.id === mainId);
       const subCat = mainCat?.subCategories.find(s => s.id === subId);
       return {
         name: subCat ? subCat.name[language] : mainCat ? mainCat.name[language] : id,
         icon: subCat ? subCat.icon : mainCat ? mainCat.icon : '🏷️'
       };
    } else {
       const cat = categories.find(c => c.id === id);
       return {
         name: cat ? cat.name[language] : id,
         icon: cat ? cat.icon : '🏷️'
       };
    }
  };

  if (!data) return <div className="p-6 text-center text-teal animate-pulse">Loading...</div>;

  const COLORS = ['#00C9A7', '#FFD166', '#EF476F', '#118AB2', '#073B4C'];
  
  const barData = [
    { name: '1', spent: 100 },
    { name: '2', spent: 300 },
    { name: '3', spent: 150 },
    { name: '4', spent: 200 },
    { name: '5', spent: 180 },
    { name: '6', spent: 400 },
    { name: '7', spent: 50 },
  ];

  return (
    <div className="p-6 space-y-6 pb-32 overflow-y-auto h-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl font-bold text-white">{t('stats')}</h2>
      </div>

      {/* SEGMENTED TAB CONTROLLER */}
      <div className="flex bg-navy p-1 rounded-2xl border border-slate-800 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setMode('basic')}
          className={[
            "flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shrink-0 min-w-[75px]",
            mode === 'basic' ? "bg-teal text-navy-dark shadow" : "text-slate-400 hover:text-slate-200"
          ].join(' ')}
        >
          <Target size={13} />
          {language === 'ar' ? 'التحليل العادي' : 'Analysis'}
        </button>
        <button
          onClick={() => setMode('journey')}
          className={[
            "flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shrink-0 min-w-[75px]",
            mode === 'journey' ? "bg-teal text-navy-dark shadow" : "text-slate-400 hover:text-slate-200"
          ].join(' ')}
        >
          <Map size={13} />
          {language === 'ar' ? 'رحلة المال' : 'Money Flow'}
        </button>
        <button
          onClick={() => setMode('forecast')}
          className={[
            "flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shrink-0 min-w-[75px]",
            mode === 'forecast' ? "bg-teal text-navy-dark shadow" : "text-slate-400 hover:text-slate-200"
          ].join(' ')}
        >
          <Brain size={13} />
          {language === 'ar' ? 'التنبؤ الذكي' : 'AI Forecast'}
        </button>
        <button
          onClick={() => setMode('history')}
          className={[
            "flex-1 py-2.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shrink-0 min-w-[75px]",
            mode === 'history' ? "bg-teal text-navy-dark shadow" : "text-slate-400 hover:text-slate-200"
          ].join(' ')}
        >
          <Layers size={13} />
          {language === 'ar' ? 'سجل العمليات' : 'History & Compare'}
        </button>
      </div>

      {mode === 'journey' && <MoneyJourneyView />}
      {mode === 'forecast' && <AIForecastView />}

      {mode === 'history' && (() => {
        // Dynamic Filtering
        const filteredTransactions = allTransactions.filter(tx => {
          // Search string matching
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const merchantMatch = tx.merchant?.toLowerCase().includes(q);
            const noteMatch = tx.note?.toLowerCase().includes(q);
            const catDetails = getCategoryDetails(tx.category);
            const categoryMatch = catDetails.name.toLowerCase().includes(q);
            if (!merchantMatch && !noteMatch && !categoryMatch) return false;
          }

          // Month Filter (tx.date is "YYYY-MM-DD")
          if (selectedMonth !== 'all') {
            const txMonth = tx.date.split('-')[1];
            if (txMonth !== selectedMonth) return false;
          }

          // Day Filter
          if (selectedDay !== 'all') {
            const txDay = parseInt(tx.date.split('-')[2]);
            if (txDay !== parseInt(selectedDay)) return false;
          }

          // Category Filter
          if (selectedCategory !== 'all') {
            if (tx.category !== selectedCategory) return false;
          }

          // Type filter
          if (selectedType !== 'all') {
            if (tx.type !== selectedType) return false;
          }

          return true;
        });

        // Calculations for active filters
        const incomingSum = filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
          
        const outgoingSum = filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Grouping logic for comparison chart
        const chartDataMap: Record<string, { date: string, incoming: number, outgoing: number }> = {};
        
        filteredTransactions.forEach(tx => {
          let key = tx.date;
          if (selectedMonth === 'all') {
            key = tx.date.substring(0, 7); // group by Month YYYY-MM
          }

          if (!chartDataMap[key]) {
            chartDataMap[key] = { date: key, incoming: 0, outgoing: 0 };
          }
          if (tx.type === 'income') {
            chartDataMap[key].incoming += tx.amount;
          } else {
            chartDataMap[key].outgoing += tx.amount;
          }
        });

        const compareData = Object.values(chartDataMap)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(item => {
            let label = item.date;
            if (selectedMonth === 'all') {
              const parts = item.date.split('-');
              const mIdx = parseInt(parts[1]) - 1;
              const mNames = [
                language === 'ar' ? 'يناير' : 'Jan',
                language === 'ar' ? 'فبراير' : 'Feb',
                language === 'ar' ? 'مارس' : 'Mar',
                language === 'ar' ? 'أبريل' : 'Apr',
                language === 'ar' ? 'مايو' : 'May',
                language === 'ar' ? 'يونيو' : 'Jun',
                language === 'ar' ? 'يوليو' : 'Jul',
                language === 'ar' ? 'أغسطس' : 'Aug',
                language === 'ar' ? 'سبتمبر' : 'Sep',
                language === 'ar' ? 'أكتوبر' : 'Oct',
                language === 'ar' ? 'نوفمبر' : 'Nov',
                language === 'ar' ? 'ديسمبر' : 'Dec'
              ];
              label = mNames[mIdx] || item.date;
            } else {
              const parts = item.date.split('-');
              label = parts[2]; // Day number
            }
            return {
              ...item,
              label,
              incoming: item.incoming,
              outgoing: item.outgoing
            };
          });

        const monthsList = [
          { value: 'all', env_ar: 'كل الشهور', env_en: 'All Months' },
          { value: '01', env_ar: 'يناير (01)', env_en: 'Jan (01)' },
          { value: '02', env_ar: 'فبراير (02)', env_en: 'Feb (02)' },
          { value: '03', env_ar: 'مارس (03)', env_en: 'Mar (03)' },
          { value: '04', env_ar: 'أبريل (04)', env_en: 'Apr (04)' },
          { value: '05', env_ar: 'مايو (05)', env_en: 'May (05)' },
          { value: '06', env_ar: 'يونيو (06)', env_en: 'Jun (06)' },
          { value: '07', env_ar: 'يوليو (07)', env_en: 'Jul (07)' },
          { value: '08', env_ar: 'أغسطس (08)', env_en: 'Aug (08)' },
          { value: '09', env_ar: 'سبتمبر (09)', env_en: 'Sep (09)' },
          { value: '10', env_ar: 'أكتوبر (10)', env_en: 'Oct (10)' },
          { value: '11', env_ar: 'نوفمبر (11)', env_en: 'Nov (11)' },
          { value: '12', env_ar: 'ديسمبر (12)', env_en: 'Dec (12)' }
        ];

        return (
          <div className="space-y-6">
            {/* Dynamic Comparison Chart */}
            <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-teal" />
                    {language === 'ar' ? 'مقارنة الإيداعات والإنفاق' : 'Inflow vs. Outflow Comparison'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {selectedMonth === 'all' 
                      ? (language === 'ar' ? 'عرض مجمع للشهور النشطة' : 'Aggregated display for active months')
                      : (language === 'ar' ? `تحليل يومي لشهر ${monthsList.find(m => m.value === selectedMonth)?.env_ar}` : `Daily review for ${monthsList.find(m => m.value === selectedMonth)?.env_en}`)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="w-2.5 h-2.5 bg-teal rounded-full"></span>
                    <span className="text-slate-400">{language === 'ar' ? 'إيداع' : 'Inflow'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                    <span className="text-slate-400">{language === 'ar' ? 'إنفاق' : 'Outflow'}</span>
                  </div>
                </div>
              </div>

              {/* Glowing Futuristic Comparison Chart */}
              <div className="h-48 relative w-full mb-4">
                {compareData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    {language === 'ar' ? 'لا توجد بيانات كافية للفلترة الحالية' : 'No matching chart data'}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.6} vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#64748b" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={{ stroke: '#334155' }}
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={{ stroke: '#334155' }}
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(v) => v > 0 ? `${v}` : ''}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '16px', 
                          color: '#fff', 
                          fontSize: '11px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                        }}
                      />
                      <Bar dataKey="incoming" name={language === 'ar' ? 'إيداعات' : 'Inflows'} fill="#00C9A7" radius={[4, 4, 0, 0]} barSize={8} />
                      <Bar dataKey="outgoing" name={language === 'ar' ? 'مصاريف' : 'Expenses'} fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Sum Card Badges */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-navy rounded-2xl p-3 border border-slate-800 flex flex-col justify-center">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <ArrowUpRight size={10} className="text-teal" />
                    {language === 'ar' ? 'إجمالي الإيداعات' : 'Total Inflow'}
                  </span>
                  <span className="text-xs font-black text-teal mt-1 truncate">{incomingSum.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">EGP</span></span>
                </div>
                <div className="bg-navy rounded-2xl p-3 border border-slate-800 flex flex-col justify-center">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <ArrowDownLeft size={10} className="text-rose-400" />
                    {language === 'ar' ? 'إجمالي الإنفاق' : 'Total Outflow'}
                  </span>
                  <span className="text-xs font-black text-rose-400 mt-1 truncate">{outgoingSum.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">EGP</span></span>
                </div>
                <div className="bg-navy rounded-2xl p-3 border border-slate-800 flex flex-col justify-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Sparkles size={10} className="text-indigo-400" />
                    {language === 'ar' ? 'الصافي' : 'Net Surplus'}
                  </span>
                  <span className={`text-xs font-black mt-1 truncate ${incomingSum - outgoingSum >= 0 ? 'text-indigo-400' : 'text-slate-300'}`}>
                    {(incomingSum - outgoingSum).toLocaleString()} <span className="text-[9px] font-normal text-slate-400">EGP</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Filters Dashboard Console */}
            <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <Filter size={15} className="text-teal animate-pulse" />
                  {language === 'ar' ? 'تخصيص تاريخ السجل والمعاملات' : 'Filter Date & Parameters'}
                </h4>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMonth('all');
                    setSelectedDay('all');
                    setSelectedCategory('all');
                    setSelectedType('all');
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-navy px-2 py-1 rounded-lg border border-slate-800"
                >
                  <RefreshCw size={10} />
                  {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                </button>
              </div>

              {/* Selector Select Inputs */}
              <div className="grid grid-cols-2 gap-3">
                {/* Months Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-bold">{language === 'ar' ? 'اختر الشهر' : 'Month'}</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setSelectedDay('all'); // Reset day when changing month to avoid impossible dates
                    }}
                    className="w-full bg-navy border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2.5 outline-none focus:border-teal ltr:text-left text-right font-medium"
                  >
                    {monthsList.map(m => (
                      <option key={m.value} value={m.value}>
                        {language === 'ar' ? m.env_ar : m.env_en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-bold">{language === 'ar' ? 'اختر اليوم' : 'Day of Month'}</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full bg-navy border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2.5 outline-none focus:border-teal ltr:text-left text-right font-medium"
                  >
                    <option value="all">{language === 'ar' ? 'كل الأيام (الكل)' : 'All Days'}</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(d => (
                      <option key={d} value={d}>
                        {language === 'ar' ? `يوم ${d}` : `Day ${d}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category selectors */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-bold">{language === 'ar' ? 'الفئة والتصنيف' : 'Category'}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-navy border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-2.5 outline-none focus:border-teal ltr:text-left text-right font-medium"
                  >
                    <option value="all">{language === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name[language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Text Query Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 block font-bold">{language === 'ar' ? 'بحث حر (المحل والوصف)' : 'Search keyword'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'ar' ? 'ابحث عن كود مبيعات، كافيه...' : 'Search note/merchant...'}
                      className="w-full bg-navy border border-slate-800 text-slate-200 text-xs rounded-xl pl-8 pr-3 py-2.5 outline-none focus:border-teal text-right rtl:text-right"
                    />
                    <Search size={14} className="text-slate-500 absolute left-2.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Transaction Type Pills */}
              <div className="pt-2 border-t border-slate-800/65 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}</span>
                <div className="flex gap-1.5 bg-navy border border-slate-800 p-0.5 rounded-xl">
                  {([
                    { val: 'all', labels: { ar: 'الكل', en: 'All' } },
                    { val: 'income', labels: { ar: 'إيداعات', en: 'Inflows' } },
                    { val: 'expense', labels: { ar: 'مصاريف', en: 'Outflows' } }
                  ] as const).map(pill => (
                    <button
                      key={pill.val}
                      onClick={() => setSelectedType(pill.val)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                        selectedType === pill.val 
                          ? 'bg-teal text-navy-dark shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {language === 'ar' ? pill.labels.ar : pill.labels.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Matching Transactions List Box */}
            <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 font-sans">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <ListFilter size={15} className="text-teal" />
                  {language === 'ar' ? 'المعاملات المطابقة' : 'Matching Dataset'}
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                    {filteredTransactions.length}
                  </span>
                </h3>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'لم يعثر على مبيعات متوافقة مع شروط الفلترة.' : 'No transactions match these filter choices.'}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {filteredTransactions.map((tx: any) => {
                    const cat = getCategoryDetails(tx.category);
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="p-3 bg-navy rounded-2xl border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/20 transition cursor-pointer flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-10 h-10 rounded-xl bg-navy-light border border-slate-800 flex items-center justify-center">
                            {cat.icon}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5">{tx.merchant || cat.name}</p>
                            <span className="text-[9px] text-slate-500 block">
                              {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                              {tx.note && ` • "${tx.note}"`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-xs font-extrabold ${tx.type === 'income' ? 'text-teal' : 'text-slate-200'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount} EGP
                          </p>
                          <span className="text-[8px] text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                            {tx.type === 'income' ? (language === 'ar' ? 'إيداع' : 'Deposit') : (language === 'ar' ? 'إنفاق' : 'Expense')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {mode === 'basic' && (
        <>
          <button 
            onClick={() => navigate('/inflation')}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl p-4 flex items-center justify-between text-white shadow-lg hover:opacity-90 transition mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              <div className="text-left rtl:text-right">
                <h3 className="font-bold">{language === 'ar' ? 'مقارنة الأسعار والتضخم' : 'Price Timeline & Inflation'}</h3>
                <p className="text-xs text-white/80">{language === 'ar' ? 'شوف تأثير التضخم على مشترياتك الثابتة' : 'Track inflation impact on your fixed expenses'}</p>
              </div>
            </div>
          </button>

          {/* Monthly summary cards logic */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label={language === 'ar' ? 'اليوم' : 'Today'} amount={50.00} />
            <StatCard label={language === 'ar' ? 'أمس' : 'Yesterday'} amount={120.00} />
            <StatCard label={language === 'ar' ? 'الأسبوع الحالي' : 'This Week'} amount={980.00} />
          </div>

          <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-4">{t('spending_overview')}</h3>
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
                      <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A2942', borderColor: '#00C9A7', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 mt-4">
            <h3 className="font-semibold text-slate-200 mb-4">{language === 'ar' ? 'مصروفات الأسبوع' : 'Weekly Spending'}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#1A2942', borderColor: '#00C9A7', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="spent" fill="#00C9A7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data.advanced?.heatmapData && (
            <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 mt-4 overflow-hidden">
               <h3 className="font-semibold text-slate-200 mb-4">{language === 'ar' ? 'خريطة الإنفاق الحرارية (آخر 30 يوم)' : 'Spending Heatmap'}</h3>
               <div className="flex flex-wrap gap-1">
                  {data.advanced.heatmapData.map((d: any, i: number) => {
                     let opacity = 0.1;
                     if(d.spent > 0) opacity = 0.4;
                     if(d.spent > 100) opacity = 0.7;
                     if(d.spent > 500) opacity = 1;
                     return (
                       <div 
                         key={i} 
                         className="w-6 h-6 rounded bg-teal/10 relative group transition-all hover:scale-110"
                         style={{ backgroundColor: d.spent > 0 ? `rgba(0, 201, 167, ${opacity})` : undefined }}
                       >
                         {d.spent > 0 && (
                           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition">
                             {d.spent} ({d.date.slice(5)})
                           </div>
                         )}
                       </div>
                     );
                  })}
               </div>
            </div>
          )}

          {data.advanced?.patterns && data.advanced.patterns.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-3xl p-5 border border-indigo-500/20 mt-4 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
              <h3 className="font-semibold text-indigo-300 mb-4">{language === 'ar' ? 'اكتشاف الأنماط' : 'Pattern Discovery'}</h3>
              <div className="space-y-3">
                 {data.advanced.patterns.map((p: any) => (
                    <div key={p.id} className="bg-navy-dark/50 p-4 rounded-xl border border-indigo-500/10">
                       <h4 className="text-sm font-bold text-slate-200 mb-1">{p.title}</h4>
                       <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {data.topPlaces && data.topPlaces.length > 0 && (
            <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 mt-4">
              <h3 className="font-semibold text-slate-200 mb-4">{language === 'ar' ? 'أكثر الأماكن إنفاقاً' : 'Top Places'}</h3>
              <div className="space-y-3">
                {data.topPlaces.map((place: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-medium">{place.name}</span>
                    <span className="text-white font-bold">{place.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals && goals.length > 0 && (
            <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 mt-4">
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Target size={18} className="text-pink-500" />
                {language === 'ar' ? 'التقدم في أهدافك' : 'Goals Progress'}
              </h3>
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300 font-medium">{goal.name}</span>
                        <span className="text-xs text-slate-400">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {conscienceReport && conscienceReport.totalPrompts > 0 && (
            <div className="bg-gradient-to-br from-fuchsia-900/40 to-navy rounded-3xl p-5 border border-fuchsia-500/30 mt-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <h3 className="font-bold text-fuchsia-300 mb-4 flex items-center gap-2">
                <Brain size={20} className="text-fuchsia-400" />
                {language === 'ar' ? 'تقرير الوعي المالي الشهري' : 'Monthly Conscious Report'}
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-navy p-4 rounded-2xl border border-slate-700/50 text-center">
                  <span className="text-2xl font-black text-white">{conscienceReport.totalPrompts}</span>
                  <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'مرات سألك الضمير' : 'Times asked'}</p>
                </div>
                <div className="bg-navy p-4 rounded-2xl border border-slate-700/50 text-center">
                  <span className="text-2xl font-black text-fuchsia-400">{conscienceReport.totalSaved}</span>
                  <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'قررت متشتريش' : 'Decided not to buy'}</p>
                </div>
              </div>
              
              <div className="bg-fuchsia-500/10 p-4 rounded-2xl border border-fuchsia-500/20 text-center mb-4">
                 <p className="text-sm text-fuchsia-200/80 mb-1">{language === 'ar' ? 'إجمالي الفلوس اللي وفّرتها بوعيك' : 'Total money saved consciously'}</p>
                 <div className="flex items-center justify-center gap-2">
                   <Zap size={24} className="text-teal" />
                   <span className="text-3xl font-black text-white">{conscienceReport.totalSavedAmount}</span>
                 </div>
              </div>

              <div className="flex items-center justify-between text-sm bg-navy/50 p-3 rounded-xl border border-slate-700/50">
                 <span className="text-slate-400">{language === 'ar' ? 'أكتر فئة فيها قرارات واعية:' : 'Top conscious category:'}</span>
                 <span className="font-bold text-teal">{conscienceReport.topCategory}</span>
              </div>
            </div>
          )}
        </>
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setSelectedTransaction(null);
            fetchTransactionsList();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, amount } : { label: string, amount: number }) {
  return (
    <div className="bg-navy-light rounded-2xl flex flex-col items-center justify-center py-4 border border-slate-800">
      <span className="text-xs text-slate-400 mb-2">{label}</span>
      <span className="font-bold text-teal">{amount.toFixed(2)}</span>
    </div>
  )
}
