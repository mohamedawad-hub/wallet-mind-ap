import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  HelpCircle, 
  ChevronRight, 
  ArrowRight,
  Info
} from "lucide-react";

export default function MoneyJourneyView() {
  const { language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState("2026-06");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<number>(1);

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/money-journey?month=${selectedMonth}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-teal space-y-4">
        <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-mono">
          {language === 'ar' ? 'جاري تحضير خريطة التدفق المالي...' : 'Constructing Money Flow Map...'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const current = data.current;
  const previous = data.previous;
  const ideal = data.idealComparison;

  // Calculate MoM change helper
  const getChangeLabel = (itemLabel: string, layerNum: number) => {
    let currVal = 0;
    let prevVal = 0;

    const findItem = (list: any[], lbl: string) => {
      // translation matching
      return list.find(x => x.label.trim() === lbl.trim());
    };

    if (layerNum === 1) {
      const c = findItem(current.l1, itemLabel);
      const p = findItem(previous.l1, itemLabel);
      currVal = c ? c.percentage : 0;
      prevVal = p ? p.percentage : 0;
    } else if (layerNum === 2) {
      const c = findItem(current.l2, itemLabel);
      const p = findItem(previous.l2, itemLabel);
      currVal = c ? c.percentage : 0;
      prevVal = p ? p.percentage : 0;
    } else if (layerNum === 3) {
      const c = findItem(current.l3, itemLabel);
      const p = findItem(previous.l3, itemLabel);
      currVal = c ? c.percentage : 0;
      prevVal = p ? p.percentage : 0;
    } else if (layerNum === 4) {
      const c = findItem(current.l4, itemLabel);
      const p = findItem(previous.l4, itemLabel);
      currVal = c ? c.percentage : 0;
      prevVal = p ? p.percentage : 0;
    }

    const diff = parseFloat((currVal - prevVal).toFixed(1));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Month Selector Toggle */}
      <div className="flex items-center justify-between bg-navy-light/60 p-1.5 rounded-2xl border border-slate-800">
        <span className="text-xs font-semibold px-3 text-slate-300">
          {language === 'ar' ? 'اختر الشهر للمقارنة:' : 'Choose Month:'}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedMonth("2026-06")}
            className={["px-4 py-1.5 rounded-xl text-xs font-bold transition-all", selectedMonth === "2026-06" ? "bg-teal text-navy-dark shadow" : "text-slate-400 hover:text-slate-200"].join(' ')}
          >
            {language === 'ar' ? 'يونيو 2026 (الحالي)' : 'June 2026'}
          </button>
          <button
            onClick={() => setSelectedMonth("2026-05")}
            className={["px-4 py-1.5 rounded-xl text-xs font-bold transition-all", selectedMonth === "2026-05" ? "bg-teal text-navy-dark shadow" : "text-slate-400 hover:text-slate-200"].join(' ')}
          >
            {language === 'ar' ? 'مايو 2026 (السابق)' : 'May 2026'}
          </button>
        </div>
      </div>

      {/* Whole Picture Summary Banner */}
      <div className="bg-gradient-to-br from-indigo-950/40 to-navy-light rounded-3xl p-5 border border-indigo-500/10 shadow-lg flex gap-4 items-start relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-2xl mt-0.5">
          <Compass size={22} className="animate-spin-slow text-indigo-300" />
        </div>
        <div className="space-y-1 z-10">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
            {language === 'ar' ? 'ملخص خريطة التدفق' : 'Flow Overview Summary'}
          </h4>
          <p className="text-sm font-medium text-slate-100 leading-relaxed">
            {data.summary}
          </p>
        </div>
      </div>

      {/* INTERACTIVE 4 LAYER FLOW PIPELINE MAP */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-200 text-sm">
            {language === 'ar' ? 'أنابيب سريان المال (الطبقات الأربعة)' : 'Interactive Cashflow Pipeline'}
          </h3>
          <span className="text-[10px] text-teal bg-teal/10 px-2 py-0.5 rounded-full font-bold">
            {language === 'ar' ? `الطبقة النشطة: ${activeLayer}` : `Active Layer: ${activeLayer}`}
          </span>
        </div>

        {/* Vertical Layer Progress Nodes */}
        <div className="grid grid-cols-4 gap-1.5 mb-6 text-center">
          {[1, 2, 3, 4].map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={[
                "py-2 px-1 rounded-xl text-[10px] font-bold border transition-all",
                activeLayer === layer
                  ? "bg-slate-800 border-teal text-teal shadow-[0_0_12px_rgba(0,201,167,0.15)]"
                  : "bg-navy border-slate-800 text-slate-500 hover:text-slate-300"
              ].join(' ')}
            >
              <div className="text-[9px] text-slate-400 block mb-0.5">L{layer}</div>
              {layer === 1 && (language === 'ar' ? 'المصادر' : 'Sources')}
              {layer === 2 && (language === 'ar' ? 'التوزيع' : 'Distribute')}
              {layer === 3 && (language === 'ar' ? 'التفاصيل' : 'Details')}
              {layer === 4 && (language === 'ar' ? 'المصير' : 'Destiny')}
            </button>
          ))}
        </div>

        {/* Animation Connector Lines - Custom SVG paths depending on active layer */}
        <div className="h-16 relative bg-navy/50 rounded-2xl border border-slate-800/60 overflow-hidden mb-6 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00c9a7" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00c9a7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Curved piping visual links */}
            <path 
              d="M 40,32 C 100,20 180,45 310,32" 
              fill="none" 
              stroke="url(#grad1)" 
              strokeWidth="4" 
              className="stroke-teal opacity-50 animate-pulse" 
            />
            <path 
              d="M 50,42 C 120,55 200,15 290,42" 
              fill="none" 
              stroke="url(#grad2)" 
              strokeWidth="3" 
              className="stroke-indigo-400 opacity-40" 
            />
          </svg>
          <div className="relative text-center px-4 font-mono text-xs z-10 flex items-center gap-3">
            <span className="font-bold text-indigo-300">
              {activeLayer === 1 ? (language === 'ar' ? 'المصادر ➔ التوزيع' : 'Sources ➔ Distribution') : ''}
              {activeLayer === 2 ? (language === 'ar' ? 'التوزيع ➔ التصنيف' : 'Distribution ➔ Categories') : ''}
              {activeLayer === 3 ? (language === 'ar' ? 'التصنيف ➔ المصير' : 'Category ➔ Final Destiny') : ''}
              {activeLayer === 4 ? (language === 'ar' ? 'المصير النهائي للأصول والهدر' : 'Final Destiny of Money') : ''}
            </span>
          </div>
        </div>

        {/* Active Layer Nodes Render Block */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLayer}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* LAYER 1 RENDER */}
              {activeLayer === 1 && current.l1.map((item: any, idx: number) => {
                const diff = getChangeLabel(item.label, 1);
                return (
                  <div key={idx} className="bg-navy/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition">
                    <div>
                      <span className="font-bold text-sm text-slate-100 block">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.amount.toLocaleString()} EGP</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-teal font-extrabold text-sm block">{item.percentage}%</span>
                        <span className="text-[9px] text-slate-500">{language === 'ar' ? 'من الإجمالي' : 'of total'}</span>
                      </div>
                      {diff !== 0 && (
                        <span className={["text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5", diff > 0 ? "bg-teal-500/10 text-teal" : "bg-red-500/10 text-red-400"].join(' ')}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* LAYER 2 RENDER */}
              {activeLayer === 2 && current.l2.map((item: any, idx: number) => {
                const diff = getChangeLabel(item.label, 2);
                const isSaving = item.label.includes('ادخار');
                return (
                  <div key={idx} className="bg-navy/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition">
                    <div>
                      <span className="font-bold text-sm text-slate-100 block">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.amount.toLocaleString()} EGP</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-slate-300 font-bold text-sm block">{item.percentage}%</span>
                        <span className="text-[9px] text-slate-500">
                          {isSaving 
                            ? (language === 'ar' ? 'من الدخل الإجمالي' : 'of total income') 
                            : (language === 'ar' ? 'من المصاريف' : 'of spending')}
                        </span>
                      </div>
                      {diff !== 0 && (
                        <span className={[
                          "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center",
                          (diff < 0 && !isSaving) || (diff > 0 && isSaving)
                            ? "bg-teal-500/10 text-teal"
                            : "bg-red-500/10 text-red-400"
                        ].join(' ')}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* LAYER 3 RENDER */}
              {activeLayer === 3 && current.l3.map((item: any, idx: number) => {
                const diff = getChangeLabel(item.label, 3);
                return (
                  <div key={idx} className="bg-navy/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition">
                    <div>
                      <span className="font-bold text-sm text-slate-100 block">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.amount.toLocaleString()} EGP</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-slate-300 font-bold text-sm block">{item.percentage}%</span>
                      </div>
                      {diff !== 0 && (
                        <span className={[
                          "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center",
                          diff < 0 ? "bg-teal-500/10 text-teal" : "bg-red-500/10 text-red-400"
                        ].join(' ')}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* LAYER 4 RENDER */}
              {activeLayer === 4 && current.l4.map((item: any, idx: number) => {
                const diff = getChangeLabel(item.label, 4);
                let colorClass = "text-slate-300";
                let badgeStyle = "bg-slate-500/10 text-slate-400";
                
                if (item.label.includes('أصول')) {
                  colorClass = "text-teal font-extrabold";
                  badgeStyle = diff >= 0 ? "bg-teal-500/10 text-teal" : "bg-red-500/10 text-red-450 text-red-400";
                } else if (item.label.includes('تبديد')) {
                  colorClass = item.amount > 0 ? "text-red-400 font-bold" : "text-slate-400";
                  badgeStyle = diff <= 0 ? "bg-teal-500/10 text-teal" : "bg-red-500/10 text-red-400";
                }

                return (
                  <div key={idx} className="bg-navy/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition">
                    <div>
                      <span className={["font-bold text-sm block", colorClass].join(' ')}>{item.label}</span>
                      <span className="text-xs text-slate-400">{item.amount.toLocaleString()} EGP</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-slate-300 font-bold text-sm block">{item.percentage}%</span>
                      </div>
                      {diff !== 0 && (
                        <span className={["text-[10px] font-bold px-1.5 py-0.5 rounded", badgeStyle].join(' ')}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* COMPARED TO RECOMMENDED IDEAL RULES */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
        <h3 className="font-bold text-slate-200 text-sm mb-4">
          {language === 'ar' ? 'التوزيع المثالي المقترح وعافيتك المالية' : 'Ideal Asset Mapping & Wellness'}
        </h3>
        
        <div className="space-y-4">
          {/* Assets Target */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">{language === 'ar' ? 'تحويل الأصول (الهدف 25%+)' : 'Assets Converted (Target 25%+)'}</span>
              <span className={ideal.assets.status === 'excellent' ? 'text-teal font-bold' : 'text-orange-400 font-bold'}>
                {ideal.assets.current}% {language === 'ar' ? `(مثالي: ${ideal.assets.ideal}%)` : `(Ideal: ${ideal.assets.ideal}%)`}
              </span>
            </div>
            <div className="w-full h-2 bg-navy rounded-full overflow-hidden">
              <div 
                className={["h-full rounded-full transition-all duration-500", ideal.assets.status === 'excellent' ? 'bg-teal' : 'bg-orange-400'].join(' ')}
                style={{ width: `${Math.min(ideal.assets.current * 2, 100)}%` }}
              />
            </div>
          </div>

          {/* Commitments Limit */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">{language === 'ar' ? 'الالتزامات الثابتة (الحد الأقصى 50%)' : 'Fixed Commitments (Limit 50%)'}</span>
              <span className={ideal.commitments.status === 'excellent' ? 'text-teal font-bold' : 'text-red-400 font-bold'}>
                {ideal.commitments.current}% {language === 'ar' ? `(مثالي: ${ideal.commitments.ideal}%)` : `(Ideal: ${ideal.commitments.ideal}%)`}
              </span>
            </div>
            <div className="w-full h-2 bg-navy rounded-full overflow-hidden">
              <div 
                className={["h-full rounded-full transition-all duration-500", ideal.commitments.status === 'excellent' ? 'bg-teal' : 'bg-red-400'].join(' ')}
                style={{ width: `${Math.min(ideal.commitments.current, 100)}%` }}
              />
            </div>
          </div>

          {/* Wasted Limit */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold">{language === 'ar' ? 'الإنفاق المبدد وبدون قيمة (المثالي: 0%)' : 'Wasted Spending (Ideal: 0%)'}</span>
              <span className={ideal.wasted.current === 0 ? 'text-teal font-bold' : 'text-red-400 font-bold'}>
                {ideal.wasted.current}%
              </span>
            </div>
            <div className="w-full h-2 bg-navy rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-red-500 transition-all duration-500"
                style={{ width: `${Math.min(ideal.wasted.current * 3, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-navy/60 rounded-2xl border border-slate-800 flex gap-2.5 items-start">
          <Info size={16} className="text-teal mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {language === 'ar' 
              ? 'نموذج التوزيع المثالي يهدف إلى توجيه 25% من مجموع دخلك لصنع الذهب، الأسهم، والعوائد الاستثمارية، مع إبقاء التزاماتك المعيشية تحت حاجز 50% لمنع الهدر التام.'
              : 'The ideal model aims to direct 25% of absolute income into gold, stocks, and investments, while keeping cost of living below 50% to prevent burnout.'}
          </p>
        </div>
      </div>

      {/* FOOTER REFLECTION QUESTION */}
      <div className="bg-gradient-to-r from-teal/10 via-teal/5 to-transparent rounded-3xl p-6 border border-teal/10 text-center space-y-3 shadow">
        <HelpCircle size={32} className="mx-auto text-teal animate-bounce" />
        <h4 className="text-slate-400 text-xs tracking-wide">
          {language === 'ar' ? 'سؤال للتأمل المالي' : 'Financial Reflection Prompt'}
        </h4>
        <p className="text-lg font-bold text-teal leading-relaxed max-w-sm mx-auto">
          &ldquo;{data.question}&rdquo;
        </p>
        <p className="text-[11px] text-slate-500 italic">
          {language === 'ar' ? 'خذ دقيقة لوضع خطة جديدة اليوم مع مستشارك المالي الذكي.' : 'Take a breath and consult your AI assistant to act on these findings.'}
        </p>
      </div>
    </div>
  );
}
