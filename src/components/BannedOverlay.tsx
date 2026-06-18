import React, { useEffect, useState } from 'react';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BannedOverlay() {
  const { language } = useLanguage();
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    const handleBannedEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsBanned(true);
      if (customEvent.detail && customEvent.detail.message) {
        setBanReason(language === 'ar' ? customEvent.detail.message : customEvent.detail.messageEn || customEvent.detail.message);
      } else {
        setBanReason(
          language === 'ar' 
            ? 'تم حظر حسابك من قبل مدير النظام بسبب مخالفة شروط الكوتا والاستخدام.' 
            : 'Your credentials have been temporarily suspended by the platform administrator.'
        );
      }
    };

    window.addEventListener('user-banned', handleBannedEvent);
    return () => {
      window.removeEventListener('user-banned', handleBannedEvent);
    };
  }, [language]);

  const handleLogoutAndReset = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('premium');
    setIsBanned(false);
    window.location.href = '/';
  };

  if (!isBanned) return null;

  return (
    <div className="fixed inset-0 bg-navy-darker/95 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.4s_ease-out]">
      <div className="bg-navy-light max-w-md w-full border border-red-500/30 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(239,68,68,0.2)] space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 mx-auto">
          <ShieldAlert size={44} className="text-red-500 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">
            {language === 'ar' ? 'تم تعليق حسابك 🚫' : 'Account Suspended 🚫'}
          </h2>
          <p className="text-sm text-slate-400">
            {language === 'ar' ? 'الوصول إلى الخدمات معطل بقرار أمني' : 'Access to application features is blocked by Administration'}
          </p>
        </div>

        <div className="bg-navy/80 border border-slate-800 p-4 rounded-2xl text-start">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase block tracking-wider mb-1">
            {language === 'ar' ? 'سبب الإجراء الاداري:' : 'Administrative Action Details:'}
          </span>
          <p className="text-xs text-red-200/90 font-medium leading-relaxed">
            {banReason}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>{language === 'ar' ? 'أعد المحاولة' : 'Check Status Again'}</span>
          </button>
          
          <button 
            onClick={handleLogoutAndReset}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} />
            <span>{language === 'ar' ? 'تسجيل الخروج والانتقال للرئيسية' : 'Reset & Log Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
