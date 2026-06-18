import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowDownRight, ArrowUpRight, User, Plus, MoveRight, Layers, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Debts() {
  const { language } = useLanguage();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<'none' | 'snowball' | 'avalanche'>('none');

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/debts');
      const json = await res.json();
      if (json.success) setDebts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-teal animate-pulse"><RefreshCw size={32} className="animate-spin" /></div>;
  }

  const oweMe = debts.filter(d => d.direction === 'owe_me');
  let iOwe = debts.filter(d => d.direction === 'i_owe');

  // Apply Strategy (Snowball = lowest amount first, Avalanche = highest amount first, mock focus)
  if (strategy === 'snowball') {
    iOwe = [...iOwe].sort((a, b) => (a.amount - a.paid) - (b.amount - b.paid));
  } else if (strategy === 'avalanche') {
    iOwe = [...iOwe].sort((a, b) => (b.amount - b.paid) - (a.amount - a.paid));
  }

  const totalOweMe = oweMe.reduce((acc, d) => acc + (d.amount - d.paid), 0);
  const totalIOwe = iOwe.reduce((acc, d) => acc + (d.amount - d.paid), 0);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto pb-32">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-white">{language === 'ar' ? 'الديون' : 'Debts'}</h2>
        <button className="text-amber-500 bg-amber-500/10 p-2 rounded-xl hover:bg-amber-500/20 transition">
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-navy-light p-4 rounded-3xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal mb-2">
            <ArrowDownRight size={16} />
          </div>
          <p className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'ليا (استلام)' : 'Owed to me'}</p>
          <p className="text-xl font-bold text-teal">{totalOweMe.toLocaleString()}</p>
        </div>
        <div className="bg-navy-light p-4 rounded-3xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
            <ArrowUpRight size={16} />
          </div>
          <p className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'عليا (دفع)' : 'I owe'}</p>
          <p className="text-xl font-bold text-red-500">{totalIOwe.toLocaleString()}</p>
        </div>
      </div>

      {iOwe.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-4">
          <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-3">
            <Target size={18} />
            {language === 'ar' ? 'خطة سداد الديون' : 'Debt Repayment Plan'}
          </h3>
          <div className="flex gap-2">
             <button 
                onClick={() => setStrategy('snowball')}
                className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition ${strategy === 'snowball' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-navy border-slate-800 text-slate-400'}`}>
                <Layers size={18} className="mb-1" />
                <span className="text-xs font-bold">Snowball</span>
                <span className="text-[10px] opacity-70 mt-1">{language === 'ar' ? 'الأصغر أولاً' : 'Smallest First'}</span>
             </button>
             <button 
                onClick={() => setStrategy('avalanche')}
                className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition ${strategy === 'avalanche' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-navy border-slate-800 text-slate-400'}`}>
                <MoveRight size={18} className="mb-1" />
                <span className="text-xs font-bold">Avalanche</span>
                <span className="text-[10px] opacity-70 mt-1">{language === 'ar' ? 'الأكبر أولاً' : 'Largest First'}</span>
             </button>
          </div>
          {strategy !== 'none' && (
            <p className="text-xs text-indigo-200 mt-3 bg-indigo-500/20 p-2 rounded-xl">
               {language === 'ar' 
                 ? `تم ترتيب ديونك حسب استراتيجية ${strategy} لزيادة تحفيزك في السداد.` 
                 : `Debts sorted by ${strategy} strategy to optimize payoff.`}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">{language === 'ar' ? 'أشخاص مدينون لي' : 'People Owe Me'}</h3>
          <div className="space-y-3">
            {oweMe.map(debt => (
              <DebtCard key={debt.id} debt={debt} highlight={false} />
            ))}
            {oweMe.length === 0 && <p className="text-xs text-slate-500">{language === 'ar' ? 'لا توجد ديون نشطة.' : 'No active debts.'}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">{language === 'ar' ? 'ديون علي' : 'I Owe People'}</h3>
          <div className="space-y-3">
            {iOwe.map((debt, idx) => (
              <DebtCard key={debt.id} debt={debt} highlight={strategy !== 'none' && idx === 0} />
            ))}
            {iOwe.length === 0 && <p className="text-xs text-slate-500">{language === 'ar' ? 'لا توجد ديون نشطة.' : 'No active debts.'}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DebtCard({ debt, highlight }: { debt: any; highlight: boolean; key?: React.Key }) {
  const isOweMe = debt.direction === 'owe_me';
  const progress = (debt.paid / debt.amount) * 100;
  
  return (
    <div className={`bg-navy-light rounded-2xl p-4 border transition relative overflow-hidden ${highlight ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-slate-800/50 hover:bg-slate-800/30'}`}>
      {highlight && (
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-10">Target</div>
      )}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <User size={18} />
          </div>
          <div>
            <p className="font-semibold text-white">{debt.contact}</p>
            <p className="text-xs text-slate-500">Due: {new Date(debt.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={['font-bold', isOweMe ? 'text-teal' : 'text-red-500'].join(' ')}>
            {debt.amount.toLocaleString()} {debt.currency}
          </p>
          <p className="text-[10px] text-slate-500">Remaining: {(debt.amount - debt.paid).toLocaleString()}</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1 overflow-hidden">
        <div 
          className={['h-1.5 rounded-full', isOweMe ? 'bg-teal' : 'bg-red-500'].join(' ')} 
          style={{ width: progress + '%' }}
        ></div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{progress.toFixed(0)}% Paid</span>
        <span>{debt.paid.toLocaleString()} Paid</span>
      </div>
    </div>
  );
}
