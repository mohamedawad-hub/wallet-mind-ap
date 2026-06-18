import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useCategories } from "../context/CategoriesContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Play
} from "lucide-react";

export default function AIForecastView() {
  const { language } = useLanguage();
  const { categories } = useCategories();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interactiveQuery, setInteractiveQuery] = useState("");
  const [customReply, setCustomReply] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const fetchForecast = async () => {
    if (localStorage.getItem('aiFeaturesDisabled') === 'true') {
      setError(language === 'ar' 
        ? 'تم إيقاف الميزات الذكية مؤقتاً لتوفير الكوتا. يمكنك إعادة تفعيلها من نافذة كوتا الـ AI.' 
        : 'AI features are temporarily paused to preserve your quota. Re-enable them anytime in the AI Quota Control.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/forecast?lang=${language}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load forecast.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
    const handleStatusChange = () => {
      fetchForecast();
    };
    window.addEventListener('ai-disabled-status-changed', handleStatusChange);
    return () => window.removeEventListener('ai-disabled-status-changed', handleStatusChange);
  }, [language]);

  const handleCustomQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactiveQuery.trim()) return;

    try {
      setQueryLoading(true);
      setCustomReply(null);
      
      // We can use a simple helper endpoint on the server, or even call `/api/forecast` or standard API chat.
      // Let's create an express API handler for live forecasting simulation or proxy it to assist
      const res = await fetch("/api/emergency-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyName: `استفسار توقّعي: ${interactiveQuery}`,
          amount: data?.projectedTotalSpending || 25000
        })
      });
      const json = await res.json();
      if (json.success) {
        setCustomReply(json.data.advice || json.data.guidance);
      } else {
        setCustomReply(language === 'ar' ? "لم نتمكن من تحليل الاستفسار حالياً. جرب مجدداً." : "Could not process forecast test. Try again.");
      }
    } catch {
      setCustomReply(language === 'ar' ? "خطأ في الاتصال بالذكاء الاصطناعي." : "Error connecting to AI advisor.");
    } finally {
      setQueryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-6">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-fuchsia-500/20 border-t-fuchsia-400 rounded-full animate-spin"></div>
          <Sparkles className="w-8 h-8 text-fuchsia-400 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-sm text-fuchsia-300">
            {language === 'ar' ? 'جاري قراءة البيانات المالية والتحليل...' : 'Generating AI Projections...'}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {language === 'ar' 
              ? 'يقوم النموذج الآن بقياس سرعة إنفاقك اليومية ومطابقتها بالتسوق والمشتريات لتقدير الشهر القادم.'
              : 'Our models are calculating daily financial velocity relative to your subscription rates.'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 text-center space-y-3">
        <AlertTriangle className="mx-auto text-red-400" />
        <h4 className="font-bold text-slate-200">
          {language === 'ar' ? 'فشل إقلاع المحرك التنبئي' : 'Forecast Initialisation Failed'}
        </h4>
        <p className="text-xs text-slate-400">
          {error}
        </p>
        <button 
          onClick={fetchForecast}
          className="bg-navy border border-slate-700 hover:border-slate-600 text-xs px-4 py-2 rounded-xl text-white font-medium"
        >
          {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
        </button>
      </div>
    );
  }

  const velocityColor = data.velocityIndex >= 7 
    ? "bg-red-500 text-red-100" 
    : data.velocityIndex >= 4 
    ? "bg-yellow-500 text-yellow-950" 
    : "bg-teal text-navy-dark";

  return (
    <div className="space-y-6">
      {/* HEADER SUMMARY CARD */}
      <div className="bg-gradient-to-br from-fuchsia-950/25 to-navy-light rounded-3xl p-6 border border-fuchsia-500/10 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-fuchsia-500/5 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] text-fuchsia-400 uppercase tracking-wilder font-bold block mb-1">
              {language === 'ar' ? 'مجموع الإنفاق المتوقع للشهر القادم' : 'Projected Spending Next Month'}
            </span>
            <h2 className="text-3xl font-extrabold text-white font-mono">
              {data.projectedTotalSpending.toLocaleString()} <span className="text-sm font-sans">EGP</span>
            </h2>
          </div>
          <div className="bg-fuchsia-500/10 p-2.5 rounded-2xl">
            <Brain className="text-fuchsia-400 animate-pulse" size={24} />
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {data.outlookSummary}
        </p>
      </div>

      {/* FINANCIAL VELOCITY INDEX */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-200 text-sm">
            {language === 'ar' ? 'مؤشر سرعة الجريان المالي (Velocity)' : 'Financial Velocity Index'}
          </h3>
          <span className={["px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase", velocityColor].join(' ')}>
            {data.velocityStatus}
          </span>
        </div>

        {/* Scaled gauge */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">0 (بطيء جداً)</span>
            <span className="font-extrabold text-white text-sm font-mono">{data.velocityIndex}/10</span>
            <span className="text-slate-500 font-mono">(سريع/حرج) 10</span>
          </div>
          <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-navy border border-slate-800">
            <div 
              style={{ width: `${data.velocityIndex * 10}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-teal via-yellow-500 to-red-500 rounded-full transition-all duration-700"
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {data.velocityExplanation}
        </p>
      </div>

      {/* CATEGORY FORECASTS */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
        <h3 className="font-bold text-slate-200 text-sm mb-4">
          {language === 'ar' ? 'التوقعات التفصيلية للأقسام واليقين' : 'Predictive Category Breakdown'}
        </h3>

        <div className="space-y-3">
          {data.categoryForecasts.map((forecast: any, idx: number) => {
            let confColor = "bg-teal/10 text-teal";
            if (forecast.confidence === "medium") confColor = "bg-yellow-500/10 text-yellow-500";
            if (forecast.confidence === "low") confColor = "bg-red-500/10 text-red-400";
            
            return (
              <div key={idx} className="bg-navy/40 p-4 rounded-2xl border border-slate-800/60 hover:border-slate-700/60 transition">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-200">{forecast.category}</span>
                  <span className="font-mono text-xs font-bold text-white">
                    {forecast.projectedAmount.toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 leading-normal max-w-[200px]">{forecast.reason}</span>
                  <span className={["px-2 py-0.5 rounded font-bold uppercase", confColor].join(' ')}>
                    {forecast.confidence}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SAVINGS SUGGESTIONS */}
      <div className="bg-navy-light rounded-3xl p-5 border border-slate-800">
        <h3 className="font-bold text-slate-200 text-sm mb-4">
          {language === 'ar' ? 'خطوات عملية مقترحة للتوفير' : 'Recommended Saving Directives'}
        </h3>

        <div className="space-y-3">
          {data.savingTips.map((tip: string, idx: number) => (
            <div key={idx} className="flex gap-3 items-start bg-navy/20 p-3.5 rounded-2xl border border-slate-850">
              <div className="bg-teal/10 p-1.5 rounded-xl text-teal mt-0.5">
                <Lightbulb size={16} />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ASK THE AI PREDICTION ENGINE (Live Sandbox) */}
      <div className="bg-gradient-to-tr from-indigo-950/20 to-navy-light rounded-3xl p-5 border border-indigo-500/10 shadow-md">
        <h3 className="font-bold text-indigo-300 text-xs uppercase tracking-wider mb-2">
          {language === 'ar' ? 'محاكي وسيناريوهات المستقبل' : 'Interactive Projections Sandbox'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          {language === 'ar'
            ? 'اكتب أي تغيير ترغب في تجربته ليرى المساعد كيف سيغير في إنفاق الشهر القادم (مثال: ماذا لو خفضت مصاريف الكافيهات للنصف؟)'
            : 'Type any financial toggle to see how next month’s velocity responds (e.g. "What if I cancel gym?").'}
        </p>

        <form onSubmit={handleCustomQuery} className="flex gap-2">
          <input 
            type="text"
            value={interactiveQuery}
            onChange={(e) => setInteractiveQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ماذا لو قللت...' : 'What if I cut...'}
            className="flex-1 bg-navy border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={queryLoading || !interactiveQuery}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {queryLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>{language === 'ar' ? 'حساب' : 'Simulate'}</span>
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {customReply && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-navy/60 rounded-2xl border border-indigo-500/20 text-xs text-slate-200 leading-relaxed"
            >
              <h5 className="font-extrabold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                <Sparkles size={14} className="text-fuchsia-400" />
                {language === 'ar' ? 'تحليل السيناريو بالذكاء الاصطناعي:' : 'AI Impact Outlook:'}
              </h5>
              <p className="leading-relaxed">
                {customReply}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
