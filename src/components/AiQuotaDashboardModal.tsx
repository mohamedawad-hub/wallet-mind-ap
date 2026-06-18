import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AiQuotaDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiQuotaDashboardModal({ isOpen, onClose }: AiQuotaDashboardModalProps) {
  const { language } = useLanguage();
  const [quotaData, setQuotaData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resettingQuota, setResettingQuota] = useState(false);
  const [aiFeaturesDisabled, setAiFeaturesDisabled] = useState<boolean>(() => {
    return localStorage.getItem('aiFeaturesDisabled') === 'true';
  });
  const isPremium = localStorage.getItem('premium') === 'true';

  const fetchQuotaDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/quota-dashboard');
      const json = await res.json();
      if (json.success) {
        setQuotaData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuotaDashboard();
    }
  }, [isOpen]);

  const handleResetQuota = async () => {
    try {
      setResettingQuota(true);
      const res = await fetch('/api/ai/reset-quota', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setQuotaData((prev: any) => ({
          ...prev,
          quota: json.quota
        }));
        localStorage.setItem('aiUsage', '0');
        // Dispatch event so layout / pages can sync immediately if needed
        window.dispatchEvent(new CustomEvent('ai-quota-reset'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResettingQuota(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[250]">
      <div 
        id="ai-quota-modal" 
        className="bg-navy-light w-full max-w-md h-[85vh] rounded-3xl p-6 border border-slate-800 text-slate-100 flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-fuchsia-400 animate-pulse" size={20} />
            <h3 className="text-lg font-bold">
              {language === 'ar' ? 'مراقبة واحتساب كوتا الـ AI' : 'AI Quota Control Center'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* Preserving Quota Toggle Option */}
          <div 
            className="bg-navy border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 text-start cursor-pointer hover:bg-navy/60 transition"
            onClick={() => {
              const newVal = !aiFeaturesDisabled;
              setAiFeaturesDisabled(newVal);
              localStorage.setItem('aiFeaturesDisabled', newVal ? 'true' : 'false');
              window.dispatchEvent(new Event('ai-disabled-status-changed'));
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className={aiFeaturesDisabled ? "text-slate-400" : "text-fuchsia-400 animate-pulse"} size={18} />
                <span className="font-semibold text-xs tracking-tight text-slate-200">
                  {language === 'ar' ? 'إيقاف ميزات الـ AI للحفاظ على الكوتا' : 'Disable AI features to save quota'}
                </span>
              </div>
              <div className={['w-10 h-5.5 rounded-full p-0.5 transition-all duration-300 flex items-center shrink-0', aiFeaturesDisabled ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'].join(' ')}>
                <div className="w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-all duration-300"></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-normal">
              {language === 'ar' 
                ? 'عند تفعيل الخيار، سيتم تعطيل مقتطفات وحلول الذكاء الاصطناعي لإطالة عمر حصتك المجانية من التوكنز وتجنب نفاد الكوتا سريعاً.'
                : 'When enabled, advanced smart AI advice, triggers, and chat agents will be stopped, helping to prolong your free token balance.'}
            </p>
          </div>

          {loading && !quotaData ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'تحميل بيانات الاستهلاك...' : 'Reading token balances...'}
              </p>
            </div>
          ) : quotaData ? (
            <>
              {/* Radial-like Gauge Progress card */}
              <div className="bg-gradient-to-br from-slate-900 via-navy-light to-navy border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] text-teal font-extrabold tracking-wider uppercase block mb-1">
                      {language === 'ar' ? 'حسابك النشط حالياً' : 'Current Active Identity'}
                    </span>
                    <h4 className="font-mono text-xs font-bold text-slate-200 truncate max-w-[200px]">
                      {quotaData.quota.email}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isPremium ? "bg-amber-500/10 text-amber-400 animate-pulse" : "bg-teal/10 text-teal"}`}>
                    {isPremium ? 'PREMIUM (150K)' : 'FREE (15K)'}
                  </span>
                </div>

                {/* Progress gauge */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{language === 'ar' ? 'التوكنز المستهلكة:' : 'Tokens Consumed:'}</span>
                    <span className="font-mono text-white font-extrabold">
                      {quotaData.quota.used.toLocaleString()} / {quotaData.quota.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="overflow-hidden h-3 flex rounded-full bg-navy border border-slate-800">
                    <div 
                      style={{ width: `${Math.min(100, quotaData.quota.percentage)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-teal via-indigo-500 to-fuchsia-500 rounded-full transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{quotaData.quota.percentage}% {language === 'ar' ? 'مستنفذ' : 'exhausted'}</span>
                    <span className="font-mono">{quotaData.quota.remaining.toLocaleString()} {language === 'ar' ? 'توكن متبقي' : 'tokens free'}</span>
                  </div>
                </div>
              </div>

              {/* ACTION DIRECTIVE: RESET QUOTA */}
              <div className="bg-indigo-950/15 border border-indigo-500/10 p-4 rounded-3xl space-y-3">
                <div className="flex items-start gap-2 text-xs text-indigo-300">
                  <AlertTriangle className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                  <p className="leading-relaxed text-[11px]">
                    {language === 'ar' 
                      ? 'هل واجهتك مشاكل ليمت أو تعطل التنبؤ المالي؟ يمكنك الآن بموجب صلاحياتك إعادة تعيين واسترداد الكوتا المتاحة لحسابك وصفرية الاستهلاك فوراً بضغطة زر واحدة.'
                      : 'Has your forecast or voice parsing hit a limit? You can instantly reset and restore your account quota count to 0 in one action!'}
                  </p>
                </div>
                <button
                  disabled={resettingQuota}
                  onClick={handleResetQuota}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-900 text-white font-bold py-2.5 px-4 rounded-2xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                >
                  {resettingQuota ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <RefreshCw size={14} className="animate-spin-slow" />
                      <span>{language === 'ar' ? 'إعادة تعيين بنقرة واحدة (0/15k)' : 'One-Click Instant Quota Reset'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* TOTAL SYSTEM-WIDE AI LEDGER */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">
                    {language === 'ar' ? 'سجل العمليات ومصروفات الـ AI' : 'Audit Ledger & Token Expenses'}
                  </h4>
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded-full font-mono font-bold text-slate-400">
                    {language === 'ar' ? `آخر ${Math.min(quotaData.logs.length, 8)} عمليات` : `Latest ${Math.min(quotaData.logs.length, 8)} ops`}
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {quotaData.logs.length === 0 ? (
                    <div className="text-center py-10 bg-navy/25 rounded-2xl border border-slate-800 text-xs text-slate-500">
                      {language === 'ar' ? 'لا يوجد سجلات قيد الاستخدام بعد.' : 'No AI operations logged on current backend runtime cycle.'}
                    </div>
                  ) : (
                    quotaData.logs.slice(0, 8).map((log: any, idx: number) => {
                      const callDate = new Date(log.timestamp).toLocaleTimeString();
                      const isSuccess = log.status === 'success';
                      return (
                        <div key={log.id || idx} className="bg-navy/35 border border-slate-805 p-3 rounded-xl flex flex-col gap-2 relative">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-200 text-[11px] truncate max-w-[200px]">{log.action}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${isSuccess ? "bg-teal/10 text-teal" : "bg-red-500/10 text-red-400"}`}>
                              {isSuccess ? 'Success' : 'Failed'}
                            </span>
                          </div>

                          {/* token parameters */}
                          <div className="grid grid-cols-3 gap-1 bg-navy/40 px-2 py-1 rounded-lg text-[9px] font-mono text-slate-400 border border-slate-800/30">
                            <div>
                              <span className="text-slate-500 block text-[8px]">{language === 'ar' ? 'المدخلات' : 'Prompt'}</span>
                              <span className="text-slate-300 font-extrabold">{log.promptTokens.toLocaleString()} t</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px]">{language === 'ar' ? 'المخرجات' : 'Completion'}</span>
                              <span className="text-slate-300 font-extrabold">{log.completionTokens.toLocaleString()} t</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[8px]">{language === 'ar' ? 'المجموع' : 'Total'}</span>
                              <span className="text-teal font-extrabold">{log.totalTokens.toLocaleString()} t</span>
                            </div>
                          </div>

                          {/* metadata lines */}
                          <div className="flex justify-between items-center text-[8px] text-slate-500 px-0.5 font-mono">
                            <span className="truncate max-w-[120px]">Model: {log.model}</span>
                            <span>{callDate}</span>
                          </div>

                          {/* If failed error details */}
                          {!isSuccess && log.errorMessage && (
                            <div className="mt-1 bg-red-950/20 text-red-300 border border-red-905 p-1.5 rounded-lg text-[9px] leading-relaxed select-all font-sans">
                              {log.errorMessage}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
}
