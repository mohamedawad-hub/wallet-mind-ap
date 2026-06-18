import React, { createContext, useContext, useState, useEffect } from 'react';

export type PriorityType = 'essential' | 'entertainment' | 'investment' | 'other';

export interface SubCategory {
  id: string;
  name: { en: string; ar: string };
  icon: string;
  priority?: PriorityType;
}

export interface Category {
  id: string;
  name: { en: string; ar: string };
  icon: string;
  type: 'expense' | 'income';
  priority?: PriorityType;
  subCategories: SubCategory[];
}

const defaultCategories: Category[] = [
  {
    id: 'food',
    name: { en: 'Food', ar: 'الغذاء' },
    icon: '🍔',
    type: 'expense',
    priority: 'essential',
    subCategories: [
      { id: 'cafes', name: { en: 'Cafes', ar: 'المقاهي' }, icon: '☕', priority: 'entertainment' },
      { id: 'restaurants', name: { en: 'Restaurants', ar: 'المطاعم' }, icon: '🍽️', priority: 'entertainment' },
      { id: 'groceries', name: { en: 'Groceries', ar: 'البقالة' }, icon: '🛒', priority: 'essential' },
    ],
  },
  {
    id: 'transportation',
    name: { en: 'Transportation', ar: 'المواصلات' },
    icon: '🚗',
    type: 'expense',
    priority: 'essential',
    subCategories: [
      { id: 'gas', name: { en: 'Gas', ar: 'البنزين' }, icon: '⛽', priority: 'essential' },
      { id: 'maintenance', name: { en: 'Maintenance', ar: 'الصيانة' }, icon: '🛠️', priority: 'essential' },
      { id: 'parking', name: { en: 'Parking', ar: 'الجراج' }, icon: '🅿️', priority: 'essential' },
      { id: 'taxi', name: { en: 'Taxi', ar: 'الأجرة' }, icon: '🚕', priority: 'essential' },
    ],
  },
  {
    id: 'bills',
    name: { en: 'Bills', ar: 'فواتير' },
    icon: '🧾',
    type: 'expense',
    priority: 'essential',
    subCategories: [
      { id: 'electricity', name: { en: 'Electricity', ar: 'الكهرباء' }, icon: '⚡', priority: 'essential' },
      { id: 'gas_bill', name: { en: 'Gas', ar: 'الغاز' }, icon: '🛢️', priority: 'essential' },
      { id: 'internet', name: { en: 'Internet', ar: 'الإنترنت' }, icon: '🌐', priority: 'essential' },
      { id: 'telecom', name: { en: 'Telecommunications', ar: 'الإتصالات' }, icon: '📞', priority: 'essential' },
      { id: 'rent', name: { en: 'Rent', ar: 'الإيجار' }, icon: '🏠', priority: 'essential' },
      { id: 'tv', name: { en: 'TV', ar: 'التلفاز' }, icon: '📺', priority: 'entertainment' },
      { id: 'water', name: { en: 'Water', ar: 'المياه' }, icon: '💧', priority: 'essential' },
    ],
  },
  {
    id: 'family',
    name: { en: 'Family', ar: 'الأسرة' },
    icon: '👨‍👩‍👧‍👦',
    type: 'expense',
    priority: 'essential',
    subCategories: [
      { id: 'children', name: { en: 'Children', ar: 'الأطفال' }, icon: '👶', priority: 'essential' },
      { id: 'home_maintenance', name: { en: 'Home Maintenance', ar: 'الصيانة المنزلية' }, icon: '🛠️', priority: 'essential' },
      { id: 'services', name: { en: 'Services', ar: 'الخدمات' }, icon: '👔', priority: 'essential' },
      { id: 'pets', name: { en: 'Pets', ar: 'الحيوانات الأليفة' }, icon: '🐶', priority: 'essential' },
    ],
  },
  {
    id: 'education',
    name: { en: 'Education', ar: 'التعليم' },
    icon: '🎓',
    type: 'expense',
    priority: 'essential',
    subCategories: [
      { id: 'textbooks', name: { en: 'Textbooks', ar: 'كتب دراسية' }, icon: '📚', priority: 'essential' },
    ],
  },
  {
    id: 'health_fitness',
    name: { en: 'Health and Fitness', ar: 'الصحة و اللياقة البدنية' },
    icon: '🏥',
    type: 'expense',
    priority: 'essential',
    subCategories: [
      { id: 'doctors', name: { en: 'Doctors', ar: 'الأطباء' }, icon: '👩‍⚕️', priority: 'essential' },
      { id: 'medicine', name: { en: 'Medicine', ar: 'الأدوية' }, icon: '💊', priority: 'essential' },
      { id: 'personal_care', name: { en: 'Personal Care', ar: 'العناية الشخصية' }, icon: '🧴', priority: 'essential' },
      { id: 'sports', name: { en: 'Sports Activities', ar: 'الأنشطة الرياضية' }, icon: '🤸‍♂️', priority: 'entertainment' },
      { id: 'insurance', name: { en: 'Insurances', ar: 'التأمينات' }, icon: '🛡️', priority: 'essential' },
    ],
  },
  {
    id: 'shopping',
    name: { en: 'Shopping', ar: 'التسوق' },
    icon: '🛍️',
    type: 'expense',
    priority: 'entertainment',
    subCategories: [
      { id: 'accessories', name: { en: 'Accessories', ar: 'اكسسوارات' }, icon: '💍', priority: 'entertainment' },
      { id: 'clothes', name: { en: 'Clothes', ar: 'ملابس' }, icon: '👕', priority: 'essential' },
      { id: 'electronics', name: { en: 'Electronics', ar: 'الكترونيات' }, icon: '📱', priority: 'entertainment' },
      { id: 'shoes', name: { en: 'Shoes', ar: 'أحذية' }, icon: '👟', priority: 'essential' },
    ],
  },
  {
    id: 'travel',
    name: { en: 'Travel', ar: 'السفر' },
    icon: '🧳',
    type: 'expense',
    priority: 'entertainment',
    subCategories: [],
  },
  {
    id: 'cash_withdrawal',
    name: { en: 'Cash Withdrawal', ar: 'السحب النقدي' },
    icon: '🏧',
    type: 'expense',
    priority: 'other',
    subCategories: [],
  },
  {
    id: 'investment',
    name: { en: 'Investment', ar: 'إستثمار' },
    icon: '📈',
    type: 'expense',
    priority: 'investment',
    subCategories: [],
  },
  {
    id: 'entertainment',
    name: { en: 'Entertainment', ar: 'الترفيه' },
    icon: '📺',
    type: 'expense',
    priority: 'entertainment',
    subCategories: [
      { id: 'games', name: { en: 'Games', ar: 'العاب' }, icon: '🕹️', priority: 'entertainment' },
      { id: 'movies_audio', name: { en: 'Movies and Audio', ar: 'أفلام و صوتيات' }, icon: '🎬', priority: 'entertainment' },
    ],
  },
  {
    id: 'fees_subscriptions',
    name: { en: 'Fees & Subscriptions', ar: 'الرسوم و الإشتراكات' },
    icon: '🧾',
    type: 'expense',
    priority: 'other',
    subCategories: [],
  },
  {
    id: 'donations_gifts',
    name: { en: 'Donations & Gifts', ar: 'التبرعات و الهدايا' },
    icon: '🤲',
    type: 'expense',
    priority: 'other',
    subCategories: [
      { id: 'charity', name: { en: 'Charity', ar: 'الصدقة' }, icon: '📦', priority: 'other' },
      { id: 'zakat', name: { en: 'Zakat', ar: 'الزكاة' }, icon: '🤲', priority: 'essential' },
      { id: 'gifts', name: { en: 'Gifts', ar: 'الهدايا' }, icon: '🎁', priority: 'entertainment' },
    ],
  },
  {
    id: 'other',
    name: { en: 'Other', ar: 'أخرى' },
    icon: '💖',
    type: 'expense',
    priority: 'other',
    subCategories: [],
  }
];

interface CategoriesContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  addSubCategory: (categoryId: string, subCategory: Omit<SubCategory, 'id'>) => void;
  removeCategory: (categoryId: string) => void;
  removeSubCategory: (categoryId: string, subId: string) => void;
  editCategory: (categoryId: string, data: Partial<Category>) => void;
  editSubCategory: (categoryId: string, subId: string, data: Partial<SubCategory>) => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('walletmind_categories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  useEffect(() => {
    localStorage.setItem('walletmind_categories', JSON.stringify(categories));
  }, [categories]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory = { ...categoryData, id: `cat_${generateId()}` };
    setCategories(prev => [...prev, newCategory]);
  };

  const addSubCategory = (categoryId: string, subCategoryData: Omit<SubCategory, 'id'>) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subCategories: [...cat.subCategories, { ...subCategoryData, id: `sub_${generateId()}` }]
        };
      }
      return cat;
    }));
  };

  const removeCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const removeSubCategory = (categoryId: string, subId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subCategories: cat.subCategories.filter(sub => sub.id !== subId)
        };
      }
      return cat;
    }));
  };

  const editCategory = (categoryId: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
       cat.id === categoryId ? { ...cat, ...data } : cat
    ));
  };

  const editSubCategory = (categoryId: string, subId: string, data: Partial<SubCategory>) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subCategories: cat.subCategories.map(sub => 
            sub.id === subId ? { ...sub, ...data } : sub
          )
        };
      }
      return cat;
    }));
  };

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, addSubCategory, removeCategory, removeSubCategory, editCategory, editSubCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
