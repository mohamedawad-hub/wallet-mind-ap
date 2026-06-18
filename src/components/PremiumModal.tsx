import React, { useEffect, useState } from 'react';
import { Crown, X, Check, FileText, Download, Cloud, Brain, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface Plan {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  currency: string;
  quotaLimit: number;
  durationDays: number;
  descriptionAr: string;
  descriptionEn: string;
}

export default function PremiumModal() {
  const { isPremium, showPremiumModal, setShowPremiumModal, upgradeToPremium } = useAuth();
  const { language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/subscription-plans');
        const data = await res.json();
        if (data.success && data.plans) {
          const premiumTiers = data.plans.filter((p: any) => p.id !== 'plan_free');
          setPlans(premiumTiers);
          if (premiumTiers.length > 0) {
            setSelectedPlanId(premiumTiers[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (showPremiumModal) {
      loadPlans();
    }
  }, [showPremiumModal]);

  if (!showPremiumModal || isPremium) return null;

  const handleSelectUpgrade = () => {
    const chosenPlan = plans.find(p => p.id === selectedPlanId);
    if (chosenPlan) {
      localStorage.setItem('premium_tier', chosenPlan.id);
    }
    upgradeToPremium();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-gradient-to-b from-navy to-navy-dark w-full max-w-lg rounded-3xl p-1 border border-yellow-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-[zoomIn_0.3s_ease-out]">
        <div className="bg-navy-light rounded-[28px] p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
          
          <button 
            onClick={() => setShowPremiumModal(false)} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition z-10"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col items-center text-center mb-5 pt-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] mx-auto">
               <Crown size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {language === 'ar' ? 'باقات الاشتراك المتميزة (Premium)' : 'Premium Tiers & Pricing Plans'}
            </h2>
            <p className="text-slate-400 text-xs">
              {language === 'ar' 
                ? 'اختر الخطة المناسبة لفتح ليميت الذكاء الاصطناعي وكافة مزايا التصدير والتحليل الذكي.' 
                : 'Choose the appropriate plan to unlock features and raise AI limits.'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-60 mb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="animate-spin text-yellow-500" size={24} />
                <span className="text-xs text-slate-400">{language === 'ar' ? 'جاري جرد الباقات المتاحة...' : 'Retrieving pricing tiers...'}</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 text-center text-slate-400 text-xs">
                {language === 'ar' ? 'لا يوجد باقات مدفوعة حالياً' : 'No premium plans loaded'}
              </div>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={[
                      'p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center text-start',
                      isSelected 
                        ? 'bg-yellow-500/10 border-yellow-500/80 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                        : 'bg-navy/60 border-slate-800 hover:border-slate-700'
                    ].join(' ')}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-100">
                          {language === 'ar' ? plan.nameAr : plan.nameEn}
                        </span>
                        {isSelected && (
                          <span className="bg-yellow-500 text-slate-950 text-[7px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase">
                            <Check size={6} /> SELECTED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {language === 'ar' ? plan.descriptionAr : plan.descriptionEn}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                        <span className="flex items-center gap-0.5">
                          <Brain size={10} className="text-teal" />
                          {(plan.quotaLimit).toLocaleString()} AI Tokens
                        </span>
                        <span>•</span>
                        <span>{plan.durationDays} {language === 'ar' ? 'يوم' : 'days'}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-yellow-500 font-mono">
                        {plan.price}
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                        {plan.currency}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-3 mt-auto pt-3 border-t border-slate-800/80">
            <div className="flex flex-col gap-2 bg-navy/40 p-3 rounded-2xl text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-yellow-500 shrink-0" />
                <span>{language === 'ar' ? 'بلاك أب سحابي تلقائي بالكامل' : 'Automatic cloud-ready Firebase integration.'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={12} className="text-yellow-500 shrink-0" />
                <span>{language === 'ar' ? 'تصدير التقارير بصيغة PDF و CSV' : 'Export reports in PDF and CSV sheet format.'}</span>
              </div>
            </div>

            <button 
              onClick={handleSelectUpgrade}
              disabled={loading || plans.length === 0}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black py-3.5 rounded-xl shadow-[0_5px_20px_rgba(245,158,11,0.25)] hover:opacity-95 transition transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
            >
              {language === 'ar' ? 'إتمام الاشتراك والترقية الآن' : 'Upgrade Membership Now'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
