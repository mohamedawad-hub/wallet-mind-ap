import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  home: { en: 'Home', ar: 'الرئيسية' },
  wallets: { en: 'Wallets', ar: 'المحافظ' },
  debts: { en: 'Debts', ar: 'الديون' },
  profile: { en: 'Profile', ar: 'حسابي' },
  stats: { en: 'Stats', ar: 'الإحصائيات' },
  assistant: { en: 'Assistant', ar: 'المساعد' },
  total_net_worth: { en: 'Total Net Worth', ar: 'إجمالي الرصيد الحالي' },
  vs_last_month: { en: 'vs last month', ar: 'مقارنة بالشهر السابق' },
  spending_overview: { en: 'Spending Overview', ar: 'نظرة عامة على المصروفات' },
  recent_transactions: { en: 'Recent Transactions', ar: 'المعاملات الأخيرة' },
  refresh: { en: 'Refresh', ar: 'تحديث' },
  total_spent: { en: 'Total Spent', ar: 'إجمالي المصروفات' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  first_day_month: { en: 'First Day of Month', ar: 'أول يوم بالشهر' },
  first_day_week: { en: 'First Day of Week', ar: 'أول يوم بالأسبوع' },
  main_transactions: { en: 'Main Transactions', ar: 'المعاملات الرئيسية' },
  decimal_marks: { en: 'Decimal Marks', ar: 'العلامة العشرية' },
  exclude_debts: { en: 'Exclude Debts', ar: 'استثناء الديون' },
  current_balance: { en: 'Current Balance', ar: 'الرصيد الحالي' },
  show_stats_priorities: { en: 'Show Stats Priorities Only', ar: 'عرض أولويات الإحصائيات فقط' },
  ai_tips: { en: 'Smart Tips & Alerts', ar: 'نصائح وتنبيهات ذكية' },
  high_spending_alert: { en: 'You spent 40% more on Transport this week compared to last week. Consider public transit.', ar: 'لقد أنفقت 40٪ إضافية على المواصلات هذا الأسبوع مقارنة بالأسبوع الماضي. حاول استخدام وسائل النقل العام لتوفير المال.' },
  large_amount_alert: { en: 'Alert: Large expense detected ($400) for Dining.', ar: 'تنبيه: تم اكتشاف مصروف كبير (400) في قسم المطاعم.' },
  manage_categories: { en: 'Manage Categories', ar: 'إدارة الأقسام' },
};

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations | string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic based on request

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string) => {
    if (translations[key]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
