import React, { useState } from 'react';
import { Calendar, Wallet, Hash, Calculator, CheckSquare, Settings as SettingsIcon, Bell, ChevronDown, ChevronRight, FolderOpen, Lock, Download, Crown, FileText, Target, MessageSquare, Plus, X, LogIn, LogOut, Cloud, User, Copy, Users, CheckCircle, Share2, Award, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AiQuotaDashboardModal from '../components/AiQuotaDashboardModal';

export default function Profile() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isPremium, setShowPremiumModal, user, loginWithGoogle, logout, aiUsageCount, upgradeToPremium } = useAuth();

  const [settings, setSettings] = useState({
    excludeDebts: false,
    currentBalance: true,
    showStatsPriorities: false,
    firstDayMonth: '1',
    firstDayWeek: '1',
    mainTransactions: 'all',
    decimalMarks: '2',
    appLock: false,
    smsAutomation: true,
    travelMode: false,
  });

  const [keywords, setKeywords] = useState(['تم خصم', 'إيداع', 'سحب', 'instapay', 'vodafone cash', 'شراء']);
  const [newKeyword, setNewKeyword] = useState('');

  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [referralCount, setReferralCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('referralCount') || '0');
  });

  const referralLink = `https://walletmind.app/join?ref=${user ? encodeURIComponent(user.email) : 'guest'}_730`;

  const [showAiQuotaDashboard, setShowAiQuotaDashboard] = useState(false);

  React.useEffect(() => {
    const handleReset = () => {
      setShowAccountDetails(false);
      setShowAiQuotaDashboard(false);
    };
    window.addEventListener('reset-profile-view', handleReset);
    return () => window.removeEventListener('reset-profile-view', handleReset);
  }, []);

  const getExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSimulateReferral = () => {
    const nextCount = referralCount + 1;
    setReferralCount(nextCount);
    localStorage.setItem('referralCount', nextCount.toString());
    if (nextCount >= 3) {
      upgradeToPremium();
      alert(language === 'ar' 
        ? '🎉 تهانينا! لقد قمت بدعوة 3 أصدقاء بنجاح وتم تفعيل وترقية حسابك إلى النسخة الكاملة بريميوم مجاناً لمدة أسبوع!' 
        : '🎉 Congratulations! You have successfully referred 3 friends and your account has been upgraded to Premium for a week!'
      );
    } else {
      alert(language === 'ar'
        ? `➕ تم بنجاح محاكاة تسجيل صديق جديد من خلال رابطك! متبقي ${3 - nextCount} لتفعيل أسبوع العضوية الفاخرة.`
        : `➕ Simulated 1 successful referral sign-up! Just ${3 - nextCount} more to unlock your free premium week.`
      );
    }
  };

  const addKeyword = () => {
    if(newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
      // In a real app, save to localStorage or backend
      localStorage.setItem('smsKeywords', JSON.stringify([...keywords, newKeyword.trim()]));
    }
  };

  const removeKeyword = (k: string) => {
    const updated = keywords.filter(kw => kw !== k);
    setKeywords(updated);
    localStorage.setItem('smsKeywords', JSON.stringify(updated));
  };

  const simulateSms = () => {
    // Dispatch a custom event to simulate SMS arrival
    const event = new CustomEvent('simulated_sms', { 
      detail: { text: "تم خصم مبلغ 150.00 EGP من بطاقتك المنتهية بـ 1234 في كارفور الرصيد المتاح 1200.00 EGP." }
    });
    window.dispatchEvent(event);
  };

  const exportCSV = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    try {
      const blob = new Blob(["ID,Date,Amount,Type\n1,2026-06-17,100,Expense"], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "transactions_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) {
      console.log('Export failed');
    }
  };

  const exportPDF = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    const doc = new jsPDF();
    doc.text(language === 'ar' ? "Financial Report" : "Financial Report", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Date', 'Amount', 'Type']],
      body: [['1', '2026-06-17', '100', 'Expense']],
    });
    doc.save('financial_report.pdf');
  };

  const handleBackup = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    if (!user) {
      alert(language === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'You must login first');
      return;
    }
    alert(language === 'ar' ? 'تم حفظ النسخة الاحتياطية بنجاح!' : 'Backup saved successfully!');
  };

  const updateSetting = (key: keyof typeof settings, val: any) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-32 w-full text-start">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
        <SettingsIcon size={24} className="text-teal" />
        <h2 className="text-2xl font-bold text-white">{t('settings')}</h2>
      </div>

      <div className="space-y-4">
        {/* User Auth Card with embedded Quick Actions */}
        <div className="bg-navy-light rounded-3xl p-4 border border-slate-800">
          <div 
            onClick={() => setShowAccountDetails(true)}
            className="flex items-center justify-between cursor-pointer hover:bg-slate-800/20 p-2 rounded-2xl transition group"
          >
            <div className="flex items-center gap-3">
               <img 
                 src={user ? user.avatar : "https://api.dicebear.com/7.x/bottts/svg?seed=walletmind"} 
                 alt="Avatar" 
                 className="w-12 h-12 rounded-full border-2 border-teal object-cover transition-transform group-hover:scale-105" 
               />
               <div className="text-start">
                 <h3 className="text-white font-bold flex items-center gap-1.5">
                   {user ? user.name : (language === 'ar' ? 'مستخدم زائر' : 'Guest User')}
                   {isPremium && <Crown size={14} className="text-amber-500 fill-amber-500 font-sans" />}
                 </h3>
                 <p className="text-slate-400 text-[11px] mt-0.5">
                   {user ? user.email : (language === 'ar' ? 'اضغط لعرض الملف الشخصي ونظام الإحالة' : 'Click to view account details & referral')}
                 </p>
               </div>
            </div>
            <div className="text-slate-400 group-hover:text-teal transition-colors shrink-0">
              <ChevronRight size={18} className="transition-transform rtl:rotate-180" />
            </div>
          </div>

          {/* Quick Action Buttons directly under user details so the user can easily log out or see accounts */}
          {user ? (
            <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex gap-2.5">
              <button 
                onClick={() => setShowAccountDetails(true)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2.5 rounded-xl transition font-medium flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <User size={13} className="text-teal" />
                <span>{language === 'ar' ? 'بيانات الحساب' : 'Account Details'}</span>
              </button>
              <button 
                onClick={() => logout()}
                className="flex-1 bg-red-500/10 hover:bg-red-500/15 text-red-400 text-xs py-2.5 rounded-xl border border-red-500/20 transition font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} />
                <span>{language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>
          ) : (
            <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
              <button 
                onClick={loginWithGoogle}
                className="w-full bg-white text-gray-900 rounded-xl py-2.5 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {language === 'ar' ? 'سجل باستخدام جوجل لحفظ بياناتك' : 'Sign in with Google to save data'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation links wrapper with symmetric chevrons for perfect RTL/LTR balance */}
        <div className="bg-navy-light rounded-3xl p-2 border border-slate-800 overflow-hidden mb-4">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition border-b border-slate-800/50 group"
            onClick={() => navigate('/categories')}
          >
            <div className="flex items-center gap-4">
              <FolderOpen size={20} className="text-purple-400 shrink-0" />
              <span className="font-medium text-slate-200">{t('manage_categories')}</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 shrink-0" />
          </div>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition border-b border-slate-800/50 group"
            onClick={() => navigate('/goals')}
          >
            <div className="flex items-center gap-4">
              <Target size={20} className="text-teal shrink-0" />
              <span className="font-medium text-slate-200">{language === 'ar' ? 'إدارة الأهداف والتحديات' : 'Goals & Challenges'}</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 shrink-0" />
          </div>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition border-b border-slate-800/50 group"
            onClick={() => navigate('/subscriptions')}
          >
            <div className="flex items-center gap-4">
              <FileText size={20} className="text-pink-400 shrink-0" />
              <span className="font-medium text-slate-200">{language === 'ar' ? 'إدارة الاشتراكات' : 'Subscriptions'}</span>
            </div>
            <ChevronRight size={16} className="text-slate-500 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 shrink-0" />
          </div>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition border-b border-slate-800/50 group"
            onClick={() => {
              setShowAiQuotaDashboard(true);
            }}
          >
            <div className="flex items-center gap-4 text-fuchsia-400 font-bold">
              <Sparkles size={20} className="text-fuchsia-400 animate-pulse shrink-0" />
              <span className="text-slate-200">{language === 'ar' ? 'مراقبة واحتساب كوتا الـ AI' : 'AI Quota & Token Dashboard'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-fuchsia-500/10 text-fuchsia-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest leading-none">
                Live
              </span>
              <ChevronRight size={16} className="text-fuchsia-400/60 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </div>
          </div>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition group"
            onClick={() => navigate('/admin')}
          >
            <div className="flex items-center gap-4 text-teal font-extrabold">
              <Lock size={20} className="text-teal shrink-0" />
              <span className="text-slate-200">{language === 'ar' ? 'لوحة تحكم المسؤول الأرشد' : 'Admin Control Panel'}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-teal/10 text-teal text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest leading-none">
                Root
              </span>
              <ChevronRight size={16} className="text-teal/60 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </div>
          </div>
        </div>

        {/* Premium */}
        {!isPremium && (
          <div 
            onClick={() => setShowPremiumModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl p-4 border border-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-between cursor-pointer hover:opacity-90 transition"
          >
            <div className="flex items-center gap-4">
              <Crown size={24} className="text-white" />
              <div>
                <h3 className="font-bold text-white leading-tight">{language === 'ar' ? 'النسخة المدفوعة' : 'Premium Version'}</h3>
                <p className="text-sm text-yellow-100">{language === 'ar' ? 'اشترك الآن بدون إعلانات ومميزات غير محدودة' : 'Subscribe now for ad-free and unlimited features'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dropdowns logic wrapper */}
        <div className="bg-navy-light rounded-3xl p-2 border border-slate-800 overflow-hidden">
          <SettingDropdown 
            icon={<Calendar size={20} />} 
            label={t('first_day_month')}
            value={settings.firstDayMonth}
            onChange={(val) => updateSetting('firstDayMonth', val)}
            options={Array.from({length: 31}, (_, i) => ({ l: (i+1).toString(), v: (i+1).toString() }))}
          />
          <SettingDropdown 
            icon={<Calendar size={20} className="text-amber-500" />} 
            label={t('first_day_week')}
            value={settings.firstDayWeek}
            onChange={(val) => updateSetting('firstDayWeek', val)}
            options={[ 
              {l: language === 'ar' ? 'الأحد' : 'Sunday', v: '0'}, 
              {l: language === 'ar' ? 'الإثنين' : 'Monday', v: '1'}, 
              {l: language === 'ar' ? 'الثلاثاء' : 'Tuesday', v: '2'}, 
              {l: language === 'ar' ? 'الأربعاء' : 'Wednesday', v: '3'}, 
              {l: language === 'ar' ? 'الخميس' : 'Thursday', v: '4'}, 
              {l: language === 'ar' ? 'الجمعة' : 'Friday', v: '5'}, 
              {l: language === 'ar' ? 'السبت' : 'Saturday', v: '6'} 
            ]}
          />
          <SettingDropdown 
            icon={<Wallet size={20} className="text-emerald-500" />} 
            label={t('main_transactions')}
            value={settings.mainTransactions}
            onChange={(val) => updateSetting('mainTransactions', val)}
            options={[ {l: language === 'ar' ? 'الكل' : 'All', v: 'all'}, {l: language === 'ar' ? 'مصروفات فقط' : 'Expenses Only', v: 'expenses_only'} ]}
          />
          <SettingDropdown 
            icon={<div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">1.23</div>} 
            label={t('decimal_marks')}
            value={settings.decimalMarks}
            onChange={(val) => updateSetting('decimalMarks', val)}
            options={[ {l: language === 'ar' ? 'رقمين' : '2 Digits', v: '2'}, {l: language === 'ar' ? 'بدون' : '0 Digits', v: '0'} ]}
            noBorder={true}
          />
        </div>

        {/* Toggles */}
        <div className="bg-navy-light rounded-3xl p-2 border border-slate-800 overflow-hidden">
          <SettingToggle 
            icon={<Lock className="text-purple-400" size={20}/>} 
            label={language === 'ar' ? 'قفل التطبيق برقم سري' : 'App Lock (PIN)'} 
            checked={settings.appLock as boolean} 
            onChange={() => toggleSetting('appLock')} 
          />
          <SettingToggle 
            icon={<Calculator className="text-red-400" size={20}/>} 
            label={t('exclude_debts')} 
            checked={settings.excludeDebts as boolean} 
            onChange={() => toggleSetting('excludeDebts')} 
          />
          <SettingToggle 
            icon={<Wallet className="text-slate-400" size={20}/>} 
            label={t('current_balance')} 
            checked={settings.currentBalance as boolean} 
            onChange={() => toggleSetting('currentBalance')} 
          />
          <SettingToggle 
            icon={<Target className="text-blue-400" size={20}/>} 
            label={language === 'ar' ? 'وضع السفر (متعدد العملات)' : 'Travel Mode (Multi-Currency)'} 
            checked={settings.travelMode as boolean} 
            onChange={() => toggleSetting('travelMode')} 
          />
          <SettingToggle 
            icon={<CheckSquare className="text-teal" size={20}/>} 
            label={t('show_stats_priorities')} 
            checked={settings.showStatsPriorities as boolean} 
            onChange={() => toggleSetting('showStatsPriorities')} 
            noBorder={true}
          />
        </div>

        {/* SMS Automation Settings */}
        <div className="bg-navy-light rounded-3xl p-4 border border-slate-800 overflow-hidden">
          <SettingToggle 
            icon={<MessageSquare className="text-amber-500" size={20}/>} 
            label={language === 'ar' ? 'قراءة الرسائل تلقائياً (SMS)' : 'Auto-read SMS'} 
            checked={settings.smsAutomation as boolean} 
            onChange={() => toggleSetting('smsAutomation')} 
            noBorder={true}
          />
          {settings.smsAutomation && (
            <div className="mt-4 pt-4 border-t border-slate-800/50">
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {language === 'ar' 
                  ? 'بما أن هذا تطبيق ويب، تتطلب قراءة الرسائل صلاحيات خاصة. في تطبيق الهاتف الكامل، سيتم رصد الرسائل التي تحتوي على الكلمات الدلالية أدناه تلقائياً واقتراح إضافتها.'
                  : 'Since this is a web app, reading SMS requires native permissions. In the native app, messages containing the keywords below will be auto-detected.'}
              </p>
              
              <div className="mb-3">
                 <label className="text-xs font-semibold text-slate-300 mb-2 block">
                   {language === 'ar' ? 'الكلمات الدلالية للرصد' : 'Trigger Keywords'}
                 </label>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {keywords.map((kw, i) => (
                     <div key={i} className="bg-slate-800 text-teal px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border border-teal/20">
                       <span className="font-medium">{kw}</span>
                       <button onClick={() => removeKeyword(kw)} className="text-slate-400 hover:text-white transition">
                         <X size={12} />
                       </button>
                     </div>
                   ))}
                 </div>
                 <div className="flex gap-2 w-full items-stretch">
                   <input 
                     type="text" 
                     value={newKeyword}
                     onChange={e => setNewKeyword(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && addKeyword()}
                     placeholder={language === 'ar' ? 'كلمة جديدة (مثلاً: بنك)...' : 'New keyword...'}
                     className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-teal"
                   />
                   <button onClick={addKeyword} className="bg-teal text-navy-dark px-4 rounded-xl flex items-center justify-center hover:bg-opacity-90 transition shrink-0 cursor-pointer">
                     <Plus size={18} />
                   </button>
                 </div>
              </div>

              <button 
                onClick={simulateSms}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-3 rounded-xl transition border border-slate-700 mt-2 flex items-center justify-center gap-2"
              >
                <Bell size={16} className="text-amber-500" />
                {language === 'ar' ? 'تجربة إشعار رسالة جديدة' : 'Simulate New SMS'}
              </button>
            </div>
          )}
        </div>

        {/* Export Data */}
        <div className="space-y-3 mb-20">
          <div 
            onClick={handleBackup}
            className="bg-navy-light rounded-3xl p-4 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition relative overflow-hidden group"
          >
            <div className="flex items-center gap-4 relative z-10">
              <Cloud size={20} className="text-teal" />
              <span className="font-medium text-slate-200">{language === 'ar' ? 'أخذ نسخة احتياطية (سحابية)' : 'Cloud Backup'}</span>
            </div>
            {!isPremium && <Crown size={16} className="text-amber-500 relative z-10" />}
            <div className={`absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent ${isPremium ? 'hidden' : 'block'}`}></div>
          </div>

          <div 
            onClick={exportPDF}
            className="bg-navy-light rounded-3xl p-4 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition relative overflow-hidden group"
          >
            <div className="flex items-center gap-4 relative z-10">
              <FileText size={20} className="text-red-400" />
              <span className="font-medium text-slate-200">{language === 'ar' ? 'تصدير التقارير (PDF)' : 'Export Reports (PDF)'}</span>
            </div>
            {!isPremium && <Crown size={16} className="text-amber-500 relative z-10" />}
            <div className={`absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent ${isPremium ? 'hidden' : 'block'}`}></div>
          </div>

          <div 
            onClick={exportCSV}
            className="bg-navy-light rounded-3xl p-4 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition relative overflow-hidden group"
          >
            <div className="flex items-center gap-4 relative z-10">
              <Download size={20} className="text-blue-400" />
              <span className="font-medium text-slate-200">{language === 'ar' ? 'تصدير البيانات (CSV)' : 'Export Data (CSV)'}</span>
            </div>
            {!isPremium && <Crown size={16} className="text-amber-500 relative z-10" />}
            <div className={`absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent ${isPremium ? 'hidden' : 'block'}`}></div>
          </div>
        </div>

        {/* Dynamic Log Out / Account Reset Actions */}
        {user ? (
          <button 
            onClick={() => {
              logout();
              setShowAccountDetails(false);
            }}
            className="w-full text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/15 py-3.5 rounded-2xl border border-red-500/10 transition font-bold text-sm flex items-center justify-center gap-2 mt-2"
          >
            <LogOut size={16} />
            <span>{language === 'ar' ? 'تسجيل الخروج من الحساب الحالي' : 'Log Out Account'}</span>
          </button>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-center space-y-2.5 mt-2">
            <p className="text-[11px] text-slate-400 leading-relaxed text-start">
              {language === 'ar' 
                ? 'تنبيه: أنت تتصفح حالياً بصفة مستخدم زائر. يرجى تسجيل الدخول لحفظ المعاملات ومزامنة الكوتا بأمان.' 
                : 'Notice: You are currently browsing as a Guest. Log in to sync your budgets and cloud backups.'}
            </p>
            <button 
              onClick={loginWithGoogle}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <LogIn size={13} />
              <span>{language === 'ar' ? 'تسجيل الدخول الفوري' : 'Log In Now'}</span>
            </button>
          </div>
        )}
      </div>

      {showAccountDetails && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-navy-light w-full max-w-md rounded-3xl p-6 border border-slate-800 text-slate-100 flex flex-col space-y-5 shadow-2xl relative text-start max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <button 
              onClick={() => setShowAccountDetails(false)} 
              className="absolute top-4 end-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div className="relative inline-block mx-auto">
                <img 
                  src={user ? user.avatar : "https://api.dicebear.com/7.x/bottts/svg?seed=walletmind"} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full border-4 border-teal mx-auto object-cover" 
                />
                {isPremium && (
                  <div className="absolute -bottom-1 -end-1 bg-amber-500 p-1.5 rounded-full border-2 border-navy-light text-navy-dark">
                    <Crown size={14} className="fill-navy-dark" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight">{user ? user.name : (language === 'ar' ? 'مستخدم زائر' : 'Guest Account')}</h3>
              <p className="text-slate-400 text-xs">{user ? user.email : (language === 'ar' ? 'رقم الحساب المؤقت #G730' : 'Temporary Account #G730')}</p>
            </div>

            {/* Account Information List */}
            <div className="bg-navy/40 rounded-2xl border border-slate-800 p-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">{language === 'ar' ? 'نوع الاشتراك:' : 'Subscription:'}</span>
                <span className={isPremium ? "text-amber-400 font-bold flex items-center gap-1" : "text-teal font-semibold"}>
                  {isPremium 
                    ? (language === 'ar' ? 'النسخة الكاملة الفاخرة ⭐' : 'Full Premium Tier ⭐') 
                    : (language === 'ar' ? 'الباقة المجانية' : 'Free Tier')}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800/60 pt-3">
                <span className="text-slate-400 font-medium">{language === 'ar' ? 'تاريخ انتهاء الاشتراك:' : 'Subscription Expiry:'}</span>
                <span className={isPremium ? "text-teal font-semibold text-xs" : "text-slate-500 font-medium text-xs"}>
                  {isPremium 
                    ? getExpiryDate()
                    : (language === 'ar' ? 'لا يوجد (باقة مجانية)' : 'N/A (Free Tier)')}
                </span>
              </div>
            </div>

            {/* Referral system section inside Account Details */}
            <div className="border-t border-slate-800/80 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-teal" />
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wide">
                  {language === 'ar' ? 'برنامج الإحالة ودعوة الأصدقاء' : 'Referrals & Invitation Rewards'}
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                {language === 'ar' 
                  ? 'ادعُ 3 من أصدقائك للتسجيل باستخدام رابطك المخصص، واحصل فوراً على أسبوع كامل من الميزات المدفوعة والذكاء الاصطناعي بدون حدود!'
                  : 'Invite 3 friends to join via your private link, and immediately activate 1 week of completely unlimited Premium access!'}
              </p>

              {/* Progress circles/bar */}
              <div className="space-y-2 bg-navy/40 rounded-2xl border border-slate-800/60 p-3">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-400 font-medium">{language === 'ar' ? 'الإحالات الناجحة:' : 'Successful Referrals:'}</span>
                  <span className="text-teal font-bold">{referralCount} / 3</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full flex-1 transition-all ${referralCount >= 1 ? 'bg-teal' : 'bg-slate-700'}`}></div>
                  <div className={`h-full flex-1 transition-all ${referralCount >= 2 ? 'bg-teal' : 'bg-slate-700'}`}></div>
                  <div className={`h-full flex-1 transition-all ${referralCount >= 3 ? 'bg-teal' : 'bg-slate-700'}`}></div>
                </div>
                {referralCount >= 3 ? (
                  <p className="text-[10px] text-teal font-semibold flex items-center gap-1.5 pt-1 justify-center">
                    <CheckCircle size={10} />
                    {language === 'ar' ? 'تم تفعيل ترقية البريميوم المجانية بفضل الأصدقاء!' : 'Successfully activated Premium week! Thank you!'}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    {language === 'ar' 
                      ? `متبقي ${3 - referralCount} من الإحالات لتفعيل البريميوم.` 
                      : `Invite ${3 - referralCount} more friends to unlock premium.`}
                  </p>
                )}
              </div>

              {/* Referral Link Copy Block */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">
                  {language === 'ar' ? 'رابط الإحالة المخصص' : 'Your Unique Invitation Link'}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={referralLink} 
                    className="flex-1 bg-navy/60 border border-slate-700 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 outline-none select-all" 
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                      alert(language === 'ar' ? 'تم نسخ رابط الإحالة بنجاح للأصدقاء!' : 'Referral link copied successfully!');
                    }}
                    className="bg-teal hover:bg-opacity-90 text-navy-dark px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Simulation Button */}
              <button 
                onClick={handleSimulateReferral}
                className="w-full bg-slate-800 hover:bg-slate-705 text-[11px] text-teal font-semibold py-2 rounded-xl border border-teal/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={11} />
                <span>{language === 'ar' ? 'محاكاة دعوة صديق للتجربة' : 'Simulate 1 Successful Referral'}</span>
              </button>
            </div>
            
            {user && (
              <button 
                onClick={() => {
                  logout();
                  setShowAccountDetails(false);
                }}
                className="w-full text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 py-3 rounded-2xl transition font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={16} />
                <span>{language === 'ar' ? 'تسجيل الخروج من الحساب الحالي' : 'Log Out Account'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <AiQuotaDashboardModal 
        isOpen={showAiQuotaDashboard} 
        onClose={() => setShowAiQuotaDashboard(false)} 
      />
    </div>
  );
}

function SettingDropdown({ icon, label, value, onChange, options, noBorder }: { icon: React.ReactNode, label: string, value: string, onChange: (v: string) => void, options: {l: string, v: string}[], noBorder?: boolean }) {
  return (
    <div className={['flex flex-col gap-2.5 p-4 text-start', !noBorder ? 'border-b border-slate-800/50' : ''].join(' ')}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-slate-200 text-sm">{label}</span>
      </div>
      <div className="relative w-full">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-slate-800 text-slate-300 py-2.5 px-4 rounded-xl text-sm border border-slate-700 outline-none focus:border-teal transition"
        >
          {options.map(opt => (
            <option key={opt.v} value={opt.v}>{opt.l}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function SettingToggle({ icon, label, checked, onChange, noBorder }: { icon: React.ReactNode, label: string, checked: boolean, onChange: () => void, noBorder?: boolean }) {
  const { language } = useLanguage();
  return (
    <div 
      className={['flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/10 transition text-start', !noBorder ? 'border-b border-slate-800/50' : ''].join(' ')} 
      onClick={onChange}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
        {icon}
        <span className="font-medium text-slate-200 text-sm truncate">{label}</span>
      </div>
      <div 
        className={[
          'w-10 h-5.5 rounded-full relative transition-colors duration-300 shrink-0 cursor-pointer',
          checked ? 'bg-teal' : 'bg-slate-700'
        ].join(' ')}
      >
        <div 
          className={[
            'w-4.5 h-4.5 bg-white rounded-full shadow-md absolute top-0.5 transition-all duration-300 ease-out',
            checked ? 'left-5' : 'left-0.5'
          ].join(' ')}
        ></div>
      </div>
    </div>
  );
}
