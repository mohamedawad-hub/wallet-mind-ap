import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShieldCheck, 
  Users, 
  Settings, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  UserPlus, 
  Search, 
  Database, 
  Activity, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  X, 
  Save, 
  Volume2,
  Crown,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  UserCheck,
  Plus,
  ArrowRight,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface UserQuotaInfo {
  email: string;
  limit: number;
  used: number;
  count: number;
  isBanned?: boolean;
  lastActive?: string;
  tier?: string;
}

interface AICallLogInfo {
  id: string;
  timestamp: string;
  email: string;
  action: string;
  promptTextLength: number;
  responseTextLength: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  model: string;
}

interface SubscriptionPlanInfo {
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

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { isPremium, user } = useAuth();
  
  // Dashboard state from server
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserQuotaInfo[]>([]);
  const [logs, setLogs] = useState<AICallLogInfo[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [globalAiDisabled, setGlobalAiDisabled] = useState(false);
  const [alertBroadcast, setAlertBroadcast] = useState('');
  const [features, setFeatures] = useState({
    sosAdvisorEnabled: true,
    chatEnabled: true,
    forecastEnabled: true,
    inflationEnabled: true,
    smsParsingEnabled: true,
  });
  const [dbStats, setDbStats] = useState({
    walletsCount: 0,
    transactionsCount: 0,
    debtsCount: 0,
    goalsCount: 0,
    consciousCount: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserQuotaInfo | null>(null);
  
  // Edit user state
  const [editLimit, setEditLimit] = useState(15000);
  const [editUsed, setEditUsed] = useState(0);
  const [editTier, setEditTier] = useState('plan_free');
  const [editIsBanned, setEditIsBanned] = useState(false);
  
  // New user addition state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newLimit, setNewLimit] = useState(15000);
  const [newTier, setNewTier] = useState('plan_free');

  // Subscription plan form state
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanInfo | null>(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    nameAr: '',
    nameEn: '',
    price: 0,
    currency: 'EGP',
    quotaLimit: 15000,
    durationDays: 30,
    descriptionAr: '',
    descriptionEn: ''
  });

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard-state');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setLogs(data.logs || []);
        setGlobalAiDisabled(data.globalAiDisabledStatus);
        setAlertBroadcast(data.adminAlertBroadcast);
        setPlans(data.dbSubscriptionPlans || []);
        if (data.adminSystemFeatures) {
          setFeatures(data.adminSystemFeatures);
        }
        if (data.dbStats) {
          setDbStats(data.dbStats);
        }
      }
    } catch (e) {
      console.error(e);
      showMsg(language === 'ar' ? 'فشل تحميل بيانات لوحة التحكم' : 'Failed to retrieve directory metadata', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, [language]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateSettings = async (overrides: { globalAiDisabled?: boolean; alertBroadcast?: string; systemFeatures?: any } = {}) => {
    try {
      const payload = {
        globalAiDisabled: overrides.globalAiDisabled !== undefined ? overrides.globalAiDisabled : globalAiDisabled,
        alertBroadcast: overrides.alertBroadcast !== undefined ? overrides.alertBroadcast : alertBroadcast,
        systemFeatures: overrides.systemFeatures !== undefined ? overrides.systemFeatures : features
      };
      
      const res = await fetch('/api/admin/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setGlobalAiDisabled(data.globalAiDisabledStatus);
        setAlertBroadcast(data.adminAlertBroadcast);
        setFeatures(data.adminSystemFeatures);
        showMsg(language === 'ar' ? 'تم حفظ التحديثات بنجاح!' : 'Administrative configurations secured successfully!');
      }
    } catch (e) {
      showMsg(language === 'ar' ? 'حدث خطأ في الاتصال بالشبكة' : 'Network transmission error occurred', 'error');
    }
  };

  const handleUserUpsert = async (e?: React.FormEvent, isNew = false) => {
    if (e) e.preventDefault();
    const mailToUse = isNew ? newEmail : selectedUserForEdit?.email;
    const limitToUse = isNew ? newLimit : editLimit;
    const usedToUse = isNew ? 0 : editUsed;
    const tierToUse = isNew ? newTier : editTier;
    const bannedToUse = isNew ? false : editIsBanned;

    if (!mailToUse) {
      showMsg(language === 'ar' ? 'البريد الإلكتروني مطلوب!' : 'Email is required!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/users/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mailToUse,
          limit: limitToUse,
          used: usedToUse,
          tier: tierToUse,
          isBanned: bannedToUse
        })
      });
      const data = await res.json();
      if (data.success) {
        showMsg(
          language === 'ar' 
            ? `تم حفظ وتحديث الحساب: ${mailToUse}` 
            : `Secured custom capabilities for ${mailToUse}`
        );
        setSelectedUserForEdit(null);
        setIsAddingUser(false);
        setNewEmail('');
        fetchState();
      }
    } catch (e) {
      showMsg(language === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to commit user details', 'error');
    }
  };

  const handleToggleBan = async (email: string) => {
    try {
      const res = await fetch('/api/admin/users/toggle-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        showMsg(
          language === 'ar'
            ? `تم تعديل وضع الحظر للمستخدم ${email}`
            : `Suspension toggle processed for ${email}`
        );
        fetchState();
      }
    } catch (e) {
      showMsg('Ban operation failure', 'error');
    }
  };

  const handleUserDelete = async (email: string) => {
    if (!window.confirm(language === 'ar' ? `هل أنت متأكد من حذف الحساب ${email}؟` : `Are you sure you want to delete ${email}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        showMsg(language === 'ar' ? 'تم حذف الحساب بنجاح' : 'User profile discarded successfully');
        fetchState();
      }
    } catch (e) {
      showMsg(language === 'ar' ? 'فشلت عملية الحذف' : 'Discard action failed', 'error');
    }
  };

  const handleSimulateUser = async () => {
    try {
      const res = await fetch('/api/admin/system/add-mock-user', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showMsg(
          language === 'ar'
            ? `تمت محاكاة مستخدم جديد بنشاط حركي: ${data.user.email}`
            : `Simulated active account profile: ${data.user.email}`
        );
        fetchState();
      }
    } catch (e) {
      showMsg('Failed simulation', 'error');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm(language === 'ar' ? 'تأكيد مسح كافة السجلات؟' : 'Clear all system ledger entries?')) return;
    try {
      const res = await fetch('/api/admin/logs/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
        showMsg(language === 'ar' ? 'تم تفريغ السجلات بالكامل' : 'AI analytics ledger purged.');
      }
    } catch (e) {
      showMsg('Purge action failed', 'error');
    }
  };

  // Subscription Dynamic plan controls
  const handlePlanUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/plans/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm)
      });
      const data = await res.json();
      if (data.success) {
        showMsg(
          language === 'ar'
            ? `تم حفظ باقة الاشتراك (السعر المحدث: ${planForm.price} ${planForm.currency})`
            : `Subscription plan ${planForm.nameEn} saved successfully!`
        );
        setIsAddingPlan(false);
        setEditingPlan(null);
        fetchState();
      } else {
        showMsg(data.message || 'Error saving plan', 'error');
      }
    } catch (e) {
      showMsg('Plan upsert communication failed', 'error');
    }
  };

  const handlePlanDelete = async (id: string) => {
    if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الباقة؟ سيتم إرجاع المستخدمين المربوطين بها إلى الباقة العادية.' : 'Confirm deletion of subscription rate package?')) return;
    try {
      const res = await fetch('/api/admin/plans/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showMsg(language === 'ar' ? 'تم مسح باقة الأسعار' : 'Subscription package erased.');
        fetchState();
      }
    } catch (e) {
      showMsg('Plan delete failure', 'error');
    }
  };

  const editUser = (targetUser: UserQuotaInfo) => {
    setSelectedUserForEdit(targetUser);
    setEditLimit(targetUser.limit);
    setEditUsed(targetUser.used);
    setEditTier(targetUser.tier || 'plan_free');
    setEditIsBanned(!!targetUser.isBanned);
  };

  const openPlanAdd = () => {
    setPlanForm({
      id: '',
      nameAr: '',
      nameEn: '',
      price: 99,
      currency: 'EGP',
      quotaLimit: 80000,
      durationDays: 30,
      descriptionAr: '',
      descriptionEn: ''
    });
    setEditingPlan(null);
    setIsAddingPlan(true);
  };

  const openPlanEdit = (p: SubscriptionPlanInfo) => {
    setPlanForm({
      id: p.id,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      price: p.price,
      currency: p.currency,
      quotaLimit: p.quotaLimit,
      durationDays: p.durationDays,
      descriptionAr: p.descriptionAr,
      descriptionEn: p.descriptionEn
    });
    setEditingPlan(p);
    setIsAddingPlan(true);
  };

  // Helper calculation for active users
  const getRelativeTimeString = (isoString?: string) => {
    if (!isoString) return language === 'ar' ? 'لم يسجل نشاطاً' : 'No activity logged';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return language === 'ar' ? 'نشط الآن (أونلاين)' : 'Active now (online)';
    if (diffMins < 60) return language === 'ar' ? `نشط منذ ${diffMins} د` : `Active ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return language === 'ar' ? `نشط منذ ${diffHours} س` : `Active ${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Filter accounts
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTokensUsedAll = users.reduce((acc, current) => acc + current.used, 0);

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 text-start pt-4 space-y-4 font-sans max-h-full scrollbar-thin scrollbar-thumb-slate-800">
      
      {/* Upper Status Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal/10 rounded-xl">
            <ShieldCheck size={20} className="text-teal" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 leading-tight animate-[fadeIn_0.5s_ease-out]">
              {language === 'ar' ? 'لوحة تحكم المسؤول الأرشد' : 'Super Admin Center'}
              <span className="text-[9px] bg-red-500/20 text-red-100 px-2 py-0.5 rounded-full border border-red-500/30 uppercase font-mono tracking-wider font-extrabold animate-pulse">Root</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">System Metrics, Bans & Advanced Financial Billing</p>
          </div>
        </div>
        <button 
          onClick={fetchState}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading && !users.length ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !users.length ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <RefreshCw size={28} className="text-teal animate-spin" />
          <span className="text-xs text-slate-400">{language === 'ar' ? 'جاري جرد الخادم...' : 'Fetching directory metadata...'}</span>
        </div>
      ) : (
        <>
          {/* Toast Message */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={['p-3 rounded-2xl text-xs font-semibold text-center border shadow-lg transition-all', 
                  message.type === 'error' ? 'bg-red-950/85 border-red-800 text-red-200' : 'bg-teal-950/85 border-teal flex items-center justify-center gap-2 text-teal-200'
                ].join(' ')}
              >
                {message.type !== 'error' && <CheckCircle size={14} />}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-navy-light/90 rounded-2xl p-3 border border-slate-800 text-center flex flex-col items-center">
              <Users size={16} className="text-blue-400 mb-1" />
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{language === 'ar' ? 'حسابات نشطة' : 'Profiles Logged'}</span>
              <span className="text-base font-extrabold text-slate-100 font-mono mt-0.5">{users.length}</span>
            </div>

            <div className="bg-navy-light/90 rounded-2xl p-3 border border-slate-800 text-center flex flex-col items-center">
              <Activity size={16} className="text-fuchsia-400 mb-1" />
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{language === 'ar' ? 'إجمالي الطلبات' : 'AI Calls'}</span>
              <span className="text-base font-extrabold text-slate-100 font-mono mt-0.5">{logs.length}</span>
            </div>

            <div className="bg-navy-light/90 rounded-2xl p-3 border border-slate-800 text-center flex flex-col items-center">
              <Database size={16} className="text-teal mb-1" />
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{language === 'ar' ? 'توكنز مستهلكة' : 'Used Tokens'}</span>
              <span className="text-xs font-extrabold text-teal font-mono mt-1 leading-none">{totalTokensUsedAll.toLocaleString()}</span>
            </div>
          </div>

          {/* Alert broadcast option */}
          <div className="bg-navy-light rounded-3xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold uppercase tracking-wider">
              <Volume2 size={15} className="text-blue-400" />
              <span>{language === 'ar' ? 'شريط الإعلانات العام للمستخدمين' : 'Global Alert Broadcast Banner'}</span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              {language === 'ar'
                ? 'اكتب رسالة مهمة ستظهر كإعلان ترويجي أو تحذيري لجميع زوار المنصة في الواجهة.'
                : 'Write an administrative message that will broadcast directly to active users.'}
            </p>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={alertBroadcast}
                onChange={(e) => setAlertBroadcast(e.target.value)}
                placeholder={language === 'ar' ? 'الرسالة العامة هنا...' : 'Admin message goes here...'}
                className="flex-1 bg-navy/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal/50"
              />
              <button 
                onClick={() => handleUpdateSettings()}
                className="bg-teal hover:bg-opacity-95 text-navy-dark px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Save size={13} />
                <span>{language === 'ar' ? 'نشر' : 'Live'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Billing Subscription Pricing Management Area */}
          <div className="bg-navy-light rounded-3xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-yellow-500 animate-[pulse_2s_infinite]" />
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-200">
                  {language === 'ar' ? 'إدارة حزم أسعار وقيم الاشتراكات' : 'Subscription Plans & Pricing Pricing Models'}
                </h4>
              </div>
              <button
                onClick={openPlanAdd}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 px-2.5 py-1 text-[10px] font-extrabold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={11} />
                <span>{language === 'ar' ? 'إضافة باقة جديدة' : 'Add Rate Plan'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              {language === 'ar'
                ? 'قم بتعديل الأسعار أو إضافة باقات جديدة بحدود كوتا مخصصة. تسري هذه التعديلات لحظياً لترقيات المستخدمين والبطاقات الترويجية بالمنصة.'
                : 'Modify costs or write down new tier values. Changes reflect instantly on premium upgrade selections.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[250px] overflow-y-auto pr-1">
              {plans.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-navy/70 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-200 truncate">
                        {language === 'ar' ? p.nameAr : p.nameEn}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openPlanEdit(p)}
                          className="bg-slate-800 hover:bg-slate-700 p-1 rounded text-slate-300"
                        >
                          <Edit2 size={10} />
                        </button>
                        {p.id !== 'plan_free' && p.id !== 'plan_premium_gold' && (
                          <button 
                            onClick={() => handlePlanDelete(p.id)}
                            className="bg-red-950/20 hover:bg-red-900/40 p-1 rounded text-red-400"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-base font-black text-yellow-500 font-mono">{p.price}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest">{p.currency}</span>
                      <span className="text-[10px] text-slate-500">/ {p.durationDays} {language === 'ar' ? 'يوم' : 'days'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Database size={10} className="text-teal" />
                      {(p.quotaLimit).toLocaleString()} tokens
                    </span>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      ID: {p.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Control Panel Options */}
          <div className="bg-navy-light rounded-3xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-teal" />
              <h4 className="font-bold text-xs uppercase tracking-wide text-slate-200">
                {language === 'ar' ? 'مخطط الكوتا وميزات الذكاء الاصطناعي لتوفير الاستهلاك' : 'AI Feature Control & Quotas (Save Limit)'}
              </h4>
            </div>

            {/* Global AI toggle */}
            <div className="flex items-center justify-between bg-navy/55 border border-slate-800 p-3 rounded-2xl">
              <div>
                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Flame size={13} className="text-red-500 animate-pulse" />
                  {language === 'ar' ? 'إغلاق معالجة الـ AI فوراً' : 'Force Disable AI Globally'}
                </h5>
                <p className="text-[10px] text-slate-400">
                  {language === 'ar' ? 'يقوم بإيقاف معالجة Gemini فوراً لتوفير الكوتا أو صيانة النظام.' : 'Instantly blocks users from hitting Gemini.'}
                </p>
              </div>
              <button
                onClick={() => {
                  const targetState = !globalAiDisabled;
                  setGlobalAiDisabled(targetState);
                  handleUpdateSettings({ globalAiDisabled: targetState });
                }}
                className={['px-3 py-1.5 text-xs font-bold rounded-xl transition border cursor-pointer select-none leading-none',
                  globalAiDisabled 
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700/60'
                ].join(' ')}
              >
                {globalAiDisabled ? (language === 'ar' ? 'معطّل حالياً' : 'Disabled Now') : (language === 'ar' ? 'تشغيل طبيعي' : 'Running Normal')}
              </button>
            </div>

            {/* Micro component control lists */}
            <div className="space-y-2 pt-2 border-t border-slate-800/85">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                {language === 'ar' ? 'تعطيل خواص فرعية بشكل انتقائي للحفاظ للكوتا' : 'Toggles to Selective App Features (Save Quota)'}
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'sosAdvisorEnabled', labelAr: 'مستشار الطوارئ SOS', labelEn: 'SOS Advisor' },
                  { key: 'chatEnabled', labelAr: 'الدردشة الذكية 1:1', labelEn: 'Chat Assistant' },
                  { key: 'forecastEnabled', labelAr: 'توقعات الميزانية AI', labelEn: 'AI Forecasting' },
                  { key: 'inflationEnabled', labelAr: 'تحليل التضخم للعملة', labelEn: 'Inflation advisor' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      const updatedFeats = { ...features, [item.key]: !features[item.key as keyof typeof features] };
                      setFeatures(updatedFeats);
                      handleUpdateSettings({ systemFeatures: updatedFeats });
                    }}
                    className={[
                      'p-2.5 rounded-xl border text-[11px] font-semibold text-start transition flex flex-col justify-between h-14',
                      features[item.key as keyof typeof features]
                        ? 'bg-teal-500/5 text-teal border-teal/20 hover:bg-teal-500/10'
                        : 'bg-slate-900/60 text-slate-500 border-slate-800/80 hover:bg-slate-900/45'
                    ].join(' ')}
                  >
                    <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                    <span className="text-[9px] font-bold">
                      {features[item.key as keyof typeof features] ? '● Active' : '○ Disabled (Saved)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User directory */}
          <div className="bg-navy-light rounded-3xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-200">
                  {language === 'ar' ? 'إرشيف المستخدمين ومحركات الكوتا والأمان' : 'User Database & Quotas'}
                </h4>
              </div>
              <button
                onClick={() => {
                  setNewTier('plan_free');
                  setNewLimit(15000);
                  setIsAddingUser(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 text-[10px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <UserPlus size={11} />
                <span>{language === 'ar' ? 'إضافة مستخدم' : 'New User'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'ابحث عن مستخدمين بالبريد...' : 'Search records by email...'}
                className="w-full bg-navy/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-teal/30"
              />
            </div>

            {/* Adding user drawer layout */}
            {isAddingUser && (
              <form onSubmit={(e) => handleUserUpsert(e, true)} className="border border-blue-500/35 bg-blue-500/5 p-3 rounded-2xl space-y-3">
                <div className="flex justify-between items-center pb-1 border-b border-blue-500/10">
                  <span className="text-[10px] font-semibold text-blue-400 uppercase">{language === 'ar' ? 'إضافة مستخدم يدوي' : 'Manual Seed Account'}</span>
                  <button type="button" onClick={() => setIsAddingUser(false)} className="text-slate-400 hover:text-white">
                    <X size={13} />
                  </button>
                </div>
                <div className="space-y-2">
                  <input 
                    type="email" 
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  />
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'حزمة كوتا الاشتراك:' : 'Subscription Plan Bundle:'}</label>
                    <select
                      value={newTier}
                      onChange={(e) => {
                        const targetTier = e.target.value;
                        setNewTier(targetTier);
                        const matchPlan = plans.find(p => p.id === targetTier);
                        if (matchPlan) {
                          setNewLimit(matchPlan.quotaLimit);
                        }
                      }}
                      className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {language === 'ar' ? p.nameAr : p.nameEn} ({p.price} EGP)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400 flex-1">{language === 'ar' ? 'الحد الأقصى المخصص (Token Cap):' : 'Custom Limit Override:'}</label>
                    <input 
                      type="number" 
                      value={newLimit}
                      onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
                      className="w-28 bg-navy border border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-200 font-mono text-center"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 text-xs font-bold rounded-xl transition"
                >
                  {language === 'ar' ? 'تسجيل وحفظ الكوتا' : 'Register Account'}
                </button>
              </form>
            )}

            {/* User card profiles list */}
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800/80 pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  {language === 'ar' ? 'لم يتم العثور على حسابات مطابقة.' : 'No matching records in the system active directory.'}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const percentage = u.limit > 0 ? parseFloat(((u.used / u.limit) * 100).toFixed(1)) : 0;
                  const isPrem = u.tier && u.tier !== 'plan_free';
                  const matchPlan = plans.find(p => p.id === u.tier);
                  const planLabel = matchPlan ? (language === 'ar' ? matchPlan.nameAr : matchPlan.nameEn) : (isPrem ? 'Premium' : 'Standard Free');
                  
                  return (
                    <div 
                      key={u.email} 
                      className={['bg-navy/40 p-3 rounded-2xl border transition-colors space-y-2.5',
                        u.isBanned ? 'border-red-500/20 bg-red-950/5' : 'border-slate-800/60 hover:border-slate-700/80'
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100 truncate">{u.email}</span>
                            {u.isBanned && (
                              <span className="bg-red-500/20 text-red-400 font-black text-[7px] px-1 py-0.5 rounded border border-red-500/30 uppercase flex items-center gap-0.5 font-mono">
                                <Lock size={6} /> BANNED
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {isPrem ? (
                              <span className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black text-[7px] px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                <Crown size={7} />
                                {planLabel}
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 font-bold text-[7px] px-1.5 py-0.5 rounded uppercase">
                                {planLabel}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono">
                              {u.count || 0} {language === 'ar' ? 'طلب' : 'Calls'}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 before:content-['•'] before:text-slate-700">
                              {getRelativeTimeString(u.lastActive)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive edit, ban and delete buttons */}
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => handleToggleBan(u.email)}
                            className={['p-1 rounded cursor-pointer border',
                              u.isBanned 
                                ? 'bg-red-500/25 border-red-500/40 text-red-200' 
                                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
                            ].join(' ')}
                            title={u.isBanned ? 'Unban User' : 'Ban User'}
                          >
                            {u.isBanned ? <Unlock size={11} /> : <Lock size={11} />}
                          </button>
                          <button 
                            onClick={() => editUser(u)}
                            className="bg-slate-800 hover:bg-slate-700 p-1 rounded text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                            title="Edit User Quotas / Upgrade Subscription"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button 
                            onClick={() => handleUserDelete(u.email)}
                            className="bg-red-950/40 hover:bg-red-900 border border-red-500/10 p-1 rounded text-red-400 cursor-pointer"
                            title="Delete profile"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Quota progress slider container */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">
                            {u.used.toLocaleString()} / <span className="font-bold text-slate-200">{u.limit.toLocaleString()}</span>
                          </span>
                          <span className={percentage > 85 ? 'text-red-400' : 'text-teal'}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className={['h-full rounded-full transition-all duration-500', 
                              percentage > 85 ? 'bg-red-500' : (percentage > 50 ? 'bg-amber-500' : 'bg-teal')
                            ].join(' ')}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick pre-seed button trigger */}
            <div className="pt-1.5 flex gap-2">
              <button
                type="button"
                onClick={handleSimulateUser}
                className="flex-1 bg-slate-800/80 hover:bg-slate-850 border border-slate-700/60 rounded-xl py-2 text-[10px] text-teal font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck size={12} className="text-teal" />
                <span>{language === 'ar' ? 'محاكاة مستخدم أونلاين نشط تلقائياً' : 'Simulate 1 Registered User (Instant active seed)'}</span>
              </button>
            </div>
          </div>

          {/* User limit adjustments popup panel */}
          <AnimatePresence>
            {selectedUserForEdit && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-navy/85 backdrop-blur-md flex items-center justify-center p-4 z-[250] overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-navy-light w-full max-w-sm rounded-[30px] p-5 border border-slate-800 text-slate-100 flex flex-col space-y-4 shadow-2xl relative text-start"
                >
                  <button 
                    onClick={() => setSelectedUserForEdit(null)} 
                    className="absolute top-4 end-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-xl transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>

                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Edit2 size={16} className="text-teal" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {language === 'ar' ? 'تعديل وترقية اشتراك مخصص' : 'Control Subscription & Token Quota'}
                    </h4>
                  </div>
                  
                  <div className="p-2.5 rounded-2xl bg-navy/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{language === 'ar' ? 'حساب المستخدم المستهدف:' : 'Target email:'}</span>
                    <span className="text-xs font-bold text-slate-100 font-mono truncate block">{selectedUserForEdit.email}</span>
                  </div>

                  <form onSubmit={(e) => handleUserUpsert(e, false)} className="space-y-4">
                    
                    {/* Subscription tier drop down select box picker */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        {language === 'ar' ? 'ترقية فئة الاشتراك المعتمدة:' : 'Select Subscription Package / Upgrade Tier:'}
                      </span>
                      <select
                        value={editTier}
                        onChange={(e) => {
                          const tierId = e.target.value;
                          setEditTier(tierId);
                          const plan = plans.find(p => p.id === tierId);
                          if (plan) {
                            setEditLimit(plan.quotaLimit);
                          }
                        }}
                        className="w-full bg-navy border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold outline-none focus:border-teal"
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {language === 'ar' ? p.nameAr : p.nameEn} ({p.price} EGP)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                        {language === 'ar' ? 'الحد الأقصى المخصص (Token Limit):' : 'Custom Quota CapOverride (Token):'}
                      </label>
                      <input 
                        type="number" 
                        required
                        value={editLimit}
                        onChange={(e) => setEditLimit(parseInt(e.target.value) || 0)}
                        className="w-full bg-navy border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold font-mono outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 pb-0.5">
                        <label>{language === 'ar' ? 'المستهلك الفعلي (Used Tokens):' : 'Tokens Consumed meter:'}</label>
                        <button 
                          type="button" 
                          onClick={() => setEditUsed(0)}
                          className="text-teal hover:underline text-[9px] font-mono uppercase tracking-widest"
                        >
                          [Reset to 0]
                        </button>
                      </div>
                      <input 
                        type="number" 
                        required
                        value={editUsed}
                        onChange={(e) => setEditUsed(parseInt(e.target.value) || 0)}
                        className="w-full bg-navy border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold font-mono outline-none"
                      />
                    </div>

                    {/* Ban toggle within editor */}
                    <div className="flex items-center justify-between bg-navy/40 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[11px] text-slate-400 font-semibold">{language === 'ar' ? 'تفعيل حظر الحساب تماماً؟' : 'Ban account privileges?' }</span>
                      <button
                        type="button"
                        onClick={() => setEditIsBanned(!editIsBanned)}
                        className={['px-2.5 py-1 text-[10px] font-bold border rounded transition-colors',
                          editIsBanned ? 'bg-red-500/20 text-red-400 border-red-500/35' : 'bg-slate-800 border-slate-700 text-slate-400'
                        ].join(' ')}
                      >
                        {editIsBanned ? (language === 'ar' ? 'محظور تماماً' : 'Banned') : (language === 'ar' ? 'نشط آمن' : 'Safe/Unbanned')}
                      </button>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-teal hover:bg-opacity-90 text-navy-dark py-2.5 rounded-xl text-xs font-extrabold transition mt-1.5 flex items-center justify-center gap-1.5"
                    >
                      <Save size={13} />
                      <span>{language === 'ar' ? 'حفظ الصلاحيات وباقة الاشتراك' : 'Secure User State & Upgrade'}</span>
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New / Edit Rate plan popup modal panel */}
          <AnimatePresence>
            {isAddingPlan && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-navy/85 backdrop-blur-md flex items-center justify-center p-4 z-[250] overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-navy-light w-full max-w-sm rounded-[30px] p-5 border border-slate-800 text-slate-100 flex flex-col space-y-4 shadow-2xl relative text-start"
                >
                  <button 
                    onClick={() => setIsAddingPlan(false)} 
                    className="absolute top-4 end-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-xl transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>

                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Coins size={16} className="text-yellow-500" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {editingPlan ? (language === 'ar' ? 'تعديل تسعيرة وقيم الباقة' : 'Edit Rate Plan Pricing') : (language === 'ar' ? 'إضافة باقة أسعار جديدة' : 'Add New Pricing Package')}
                    </h4>
                  </div>

                  <form onSubmit={handlePlanUpsert} className="space-y-3">
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">{language === 'ar' ? 'الاسم (عربي):' : 'Title (AR):'}</label>
                        <input 
                          type="text" 
                          required
                          value={planForm.nameAr}
                          onChange={(e) => setPlanForm({ ...planForm, nameAr: e.target.value })}
                          className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">{language === 'ar' ? 'الاسم (إنجليزي):' : 'Title (EN):'}</label>
                        <input 
                          type="text" 
                          required
                          value={planForm.nameEn}
                          onChange={(e) => setPlanForm({ ...planForm, nameEn: e.target.value })}
                          className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">{language === 'ar' ? 'السعر:' : 'Price:'}</label>
                        <input 
                          type="number" 
                          required
                          value={planForm.price}
                          onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">{language === 'ar' ? 'كوتا التوكنز:' : 'Quota Tokens limit:'}</label>
                        <input 
                          type="number" 
                          required
                          value={planForm.quotaLimit}
                          onChange={(e) => setPlanForm({ ...planForm, quotaLimit: parseInt(e.target.value) || 0 })}
                          className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">{language === 'ar' ? 'الصلاحية (باليوم):' : 'Duration Days:'}</label>
                        <input 
                          type="number" 
                          required
                          value={planForm.durationDays}
                          onChange={(e) => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) || 0 })}
                          className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">{language === 'ar' ? 'الرمز المالي:' : 'Currency:'}</label>
                        <input 
                          type="text" 
                          required
                          value={planForm.currency}
                          onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                          className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">{language === 'ar' ? 'الوصف (عربي):' : 'Short description (AR):'}</label>
                      <textarea
                        value={planForm.descriptionAr}
                        onChange={(e) => setPlanForm({ ...planForm, descriptionAr: e.target.value })}
                        className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 h-11 resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">{language === 'ar' ? 'الوصف (إنجليزي):' : 'Short description (EN):'}</label>
                      <textarea
                        value={planForm.descriptionEn}
                        onChange={(e) => setPlanForm({ ...planForm, descriptionEn: e.target.value })}
                        className="w-full bg-navy border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 h-11 resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition mt-2 cursor-pointer"
                    >
                      {editingPlan ? (language === 'ar' ? 'حفظ وحقن التعديلات' : 'Save Package Plan') : (language === 'ar' ? 'إضافة الباقة للجمهور' : 'Publish Subscription Bundle')}
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live system logs history */}
          <div className="bg-navy-light rounded-3xl p-4 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-fuchsia-400 animate-pulse" />
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-200">
                  {language === 'ar' ? 'مراقبة استعلامات الـ AI مباشرة' : 'Live AI Token Request Logs'}
                </h4>
              </div>
              <button 
                onClick={handleClearLogs}
                className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                title="Flush tracking records"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              {language === 'ar'
                ? 'سجلات استهلاك المعالج اللحظية لطلبات المستخدمين ومعدل التوكنز المقدرة.'
                : 'Real-time trace logs detailing each client AI generation request details.'}
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800/80 text-[10px] pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-slate-500 font-mono">
                  {language === 'ar' ? '[لا توجد سجلات تتبع حالياً]' : '[Trace logs empty]'}
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={['p-2.5 rounded-xl border flex flex-col gap-1.5 transition-all text-start', 
                      log.status === 'failed' ? 'bg-red-950/20 border-red-500/10' : 'bg-slate-900/60 border-slate-800/50'
                    ].join(' ')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300 truncate max-w-[140px] block">{log.email}</span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200 text-[11px]">{log.action}</span>
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{log.model}</span>
                      </div>
                      
                      {log.status === 'success' ? (
                        <span className="bg-teal-950/40 border border-teal/20 text-teal px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-0.5 leading-none">
                          <CheckCircle size={8} /> Pass
                        </span>
                      ) : (
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-0.5 leading-none">
                          <XCircle size={8} /> Fail
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-slate-500 border-t border-slate-800/40 pt-1.5 text-[9px] font-mono">
                      <span>In/Out: {log.promptTokens} / {log.completionTokens}</span>
                      <span className="font-bold text-slate-400">Total: {log.totalTokens} Tokens</span>
                    </div>

                    {log.errorMessage && (
                      <div className="p-1 rounded bg-red-950/40 text-red-300 border border-red-500/10 text-[9px] leading-tight flex items-start gap-1">
                        <AlertTriangle size={10} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="font-medium break-all">{log.errorMessage}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
