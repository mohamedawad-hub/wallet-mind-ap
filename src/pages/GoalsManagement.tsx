import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Plus, CheckCircle2, TrendingUp, Sparkles, X, Loader2, Trash2, Calendar, Pencil } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function GoalsManagement() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [goals, setGoals] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([
    { id: 'c1', name: language === 'ar' ? 'تحدي القهوة' : 'Coffee Challenge', description: language === 'ar' ? 'متصرفش على كافيه أسبوعين' : 'No spending on coffee for 14 days', progress: 40, total: 14, daysLeft: 8, reward: '🌟' }
  ]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'goals' | 'challenges'>('goals');
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cTotal, setCTotal] = useState("");
  const [cDaysLeft, setCDaysLeft] = useState("");
  const [cReward, setCReward] = useState("🌟");

  const [adviceModal, setAdviceModal] = useState<any>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceText, setAdviceText] = useState("");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeGoalForm = () => {
    setShowAddForm(false);
    setEditingGoalId(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setDeadline("");
  };

  const openEditGoal = (goal: any) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline || "");
    setShowAddForm(true);
  };

  const handleSaveGoal = async () => {
    if (!name || !targetAmount) return;
    setSaving(true);
    try {
      const url = editingGoalId ? `/api/goals/${editingGoalId}` : "/api/goals";
      const method = editingGoalId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, targetAmount, currentAmount: currentAmount || 0, deadline })
      });
      const data = await res.json();
      if (data.success) {
        if (editingGoalId) {
          setGoals(goals.map(g => g.id === editingGoalId ? data.goal : g));
        } else {
          setGoals([...goals, data.goal]);
        }
        closeGoalForm();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الهدف؟' : 'Are you sure you want to delete this goal?')) return;
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      setGoals(goals.filter(g => g.id !== id));
    } catch(e) {
      console.log(e);
    }
  };

  const closeChallengeForm = () => {
    setShowChallengeForm(false);
    setEditingChallengeId(null);
    setCName("");
    setCDesc("");
    setCTotal("");
    setCDaysLeft("");
    setCReward("🌟");
  };

  const openEditChallenge = (c: any) => {
    setEditingChallengeId(c.id);
    setCName(c.name);
    setCDesc(c.description);
    setCTotal(c.total.toString());
    setCDaysLeft(c.daysLeft.toString());
    setCReward(c.reward);
    setShowChallengeForm(true);
  };

  const handleSaveChallenge = () => {
    if(!cName || !cTotal) return;
    if(editingChallengeId) {
       setChallenges(challenges.map(c => c.id === editingChallengeId ? {
          ...c,
          name: cName,
          description: cDesc,
          total: parseInt(cTotal) || 0,
          daysLeft: parseInt(cDaysLeft) || 0,
          reward: cReward || '🌟'
       } : c));
    } else {
       setChallenges([...challenges, {
          id: 'c' + Date.now(),
          name: cName,
          description: cDesc,
          total: parseInt(cTotal) || 0,
          daysLeft: parseInt(cDaysLeft) || parseInt(cTotal) || 0,
          reward: cReward || '🌟',
          progress: 0
       }]);
    }
    closeChallengeForm();
  };

  const handleDeleteChallenge = (id: string) => {
    if(!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا التحدي؟' : 'Are you sure you want to delete this challenge?')) return;
    setChallenges(challenges.filter(c => c.id !== id));
  };

  const getAdvice = async (goal: any) => {
    setAdviceModal(goal);
    setAdviceLoading(true);
    setAdviceText("");
    try {
      const res = await fetch(`/api/goals/${goal.id}/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language })
      });
      const data = await res.json();
      if (data.success) {
        setAdviceText(data.advice);
      } else {
        setAdviceText(language === 'ar' ? 'عذرا، فشل الاتصال بالذكاء الاصطناعي.' : 'Sorry, failed to connect to AI.');
      }
    } catch (e) {
      setAdviceText(language === 'ar' ? 'عذرا، حدث خطأ.' : 'Sorry, an error occurred.');
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-navy-dark overflow-y-auto w-full rtl:dir-rtl pt-5 px-6 pb-32">
      <div className="flex items-center justify-between mb-4">
         <button onClick={() => navigate(-1)} className="w-10 h-10 bg-navy-light rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition">
           <ArrowLeft size={20} className="transform rtl:rotate-180" />
         </button>
         <h1 className="text-xl font-bold text-white flex gap-2 items-center">
            <Target size={24} className="text-teal" />
            {language === 'ar' ? 'الأهداف والتحديات' : 'Goals & Challenges'}
         </h1>
         <div className="w-10"></div>
      </div>

      <div className="flex gap-2 p-1 bg-navy-light rounded-2xl mb-6">
        <button 
           onClick={() => setActiveTab('goals')}
           className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'goals' ? 'bg-slate-800 text-teal shadow' : 'text-slate-400 hover:text-slate-300'}`}
        >
           {language === 'ar' ? 'الأهداف' : 'Goals'}
        </button>
        <button 
           onClick={() => setActiveTab('challenges')}
           className={`flex-1 py-2 text-sm font-bold rounded-xl transition flex justify-center items-center gap-1 ${activeTab === 'challenges' ? 'bg-slate-800 text-purple-400 shadow' : 'text-slate-400 hover:text-slate-300'}`}
        >
           {language === 'ar' ? 'التحديات الممتعة' : 'Fun Challenges'}
           <Sparkles size={14} className={activeTab === 'challenges' ? 'text-purple-400' : 'text-slate-500'} />
        </button>
      </div>

      {activeTab === 'goals' && (
      <>
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-teal text-navy-dark font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-opacity-90 shadow-lg shadow-teal/20"
          >
            <Plus size={18} />
            {language === 'ar' ? 'إضافة هدف' : 'Add Goal'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-teal" /></div>
        ) : goals.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Target size={48} className="mx-auto mb-4 opacity-20" />
          <p>{language === 'ar' ? 'لا توجد أهداف مالية بعد' : 'No financial goals yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            return (
              <div key={goal.id} className="bg-navy-light p-5 rounded-3xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                  <div className="h-full bg-teal transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{goal.name}</h3>
                    {goal.deadline && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> {goal.deadline}
                      </p>
                    )}
                  </div>
                  <div className="flex">
                    <button onClick={() => openEditGoal(goal)} className="text-slate-500 hover:text-white p-2">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="text-slate-500 hover:text-red-500 p-2 -mr-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs text-slate-500">{language === 'ar' ? 'المجموع الحالي' : 'Current'}</p>
                    <p className="text-xl font-bold text-teal">{goal.currentAmount} <span className="text-sm">{goal.currency}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{language === 'ar' ? 'الهدف' : 'Target'}</p>
                    <p className="text-white font-medium">{goal.targetAmount} <span className="text-sm text-slate-400">{goal.currency}</span></p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <button 
                    onClick={() => getAdvice(goal)}
                    className="w-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-xl text-sm font-bold flex flex-row items-center justify-center gap-2 hover:bg-indigo-500/20 transition group"
                  >
                    <Sparkles size={16} className="text-yellow-400 group-hover:animate-pulse" />
                    {language === 'ar' ? 'نصيحة الذكاء الاصطناعي الخاص بك' : 'Your AI Advice'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {activeTab === 'challenges' && (
        <>
        <div className="flex justify-end mb-6">
          <button 
            onClick={() => setShowChallengeForm(true)}
            className="bg-purple-500/20 text-purple-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-500/30 transition shadow-lg"
          >
            <Plus size={18} />
            {language === 'ar' ? 'إضافة تحدي' : 'Add Challenge'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-3 rounded-2xl mb-4 text-center">
            <p className="text-sm text-purple-300 font-medium">
              {language === 'ar' ? 'التحديات تساعدك على تقليل نفقاتك بطريقة ممتعة!' : 'Challenges help you reduce expenses in a fun way!'}
            </p>
          </div>
          {challenges.map(c => (
            <div key={c.id} className="bg-navy-light p-5 rounded-3xl border border-slate-800 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl">{c.reward}</div>
                  <div>
                    <h3 className="text-white font-bold">{c.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                  </div>
                </div>
                <div className="flex">
                   <button onClick={() => openEditChallenge(c)} className="text-slate-500 hover:text-white p-2">
                     <Pencil size={16} />
                   </button>
                   <button onClick={() => handleDeleteChallenge(c.id)} className="text-slate-500 hover:text-red-500 p-2 -mr-2">
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-purple-400">{c.total - c.daysLeft} {language === 'ar' ? 'أيام تمت' : 'days out'}</span>
                  <span className="text-slate-400">{c.total} {language === 'ar' ? 'يوم' : 'days'}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000" style={{ width: `${(c.total - c.daysLeft) / c.total * 100}%` }}></div>
                </div>
                <p className="text-xs text-center text-slate-500 mt-2">
                   {language === 'ar' ? `باقي ${c.daysLeft} أيام للانتهاء` : `${c.daysLeft} days left to finish`}
                </p>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex justify-center items-end p-4 pb-10">
          <div className="bg-navy-light w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-slate-800 animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">{editingGoalId ? (language === 'ar' ? 'تعديل الهدف المالي' : 'Edit Financial Goal') : (language === 'ar' ? 'هدف مالي جديد' : 'New Financial Goal')}</h3>
              <button onClick={closeGoalForm} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder={language === 'ar' ? 'اسم الهدف (مثلا: سيارة جديدة)' : 'Goal Name (e.g. New Car)'}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              <input
                type="number"
                placeholder={language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              <input
                type="number"
                placeholder={language === 'ar' ? 'المبلغ الحالي (اختياري)' : 'Current Amount (Optional)'}
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              
              <button
                onClick={handleSaveGoal}
                disabled={saving || !name || !targetAmount}
                className="w-full bg-teal text-navy-dark font-bold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {language === 'ar' ? 'حفظ الهدف' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChallengeForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex justify-center items-end p-4 pb-10">
          <div className="bg-navy-light w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-slate-800 animate-[slideUp_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">{editingChallengeId ? (language === 'ar' ? 'تعديل التحدي' : 'Edit Challenge') : (language === 'ar' ? 'تحدي جديد' : 'New Challenge')}</h3>
              <button onClick={closeChallengeForm} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder={language === 'ar' ? 'اسم التحدي' : 'Challenge Name'}
                value={cName}
                onChange={e => setCName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              <input
                type="text"
                placeholder={language === 'ar' ? 'وصف أو طريقة التحدي' : 'Description / Goal'}
                value={cDesc}
                onChange={e => setCDesc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={language === 'ar' ? 'إجمالي الأيام' : 'Total Days'}
                  value={cTotal}
                  onChange={e => setCTotal(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
                />
                <input
                  type="number"
                  placeholder={language === 'ar' ? 'الأيام المتبقية' : 'Days Left'}
                  value={cDaysLeft}
                  onChange={e => setCDaysLeft(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal text-sm"
                />
              </div>
              <input
                type="text"
                placeholder={language === 'ar' ? 'رمز أو إيموجي (مثال: 🌟)' : 'Emoji/Icon (e.g. 🌟)'}
                value={cReward}
                onChange={e => setCReward(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal"
              />
              
              <button
                onClick={handleSaveChallenge}
                disabled={!cName || !cTotal}
                className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-purple-700 transition disabled:opacity-50"
              >
                {language === 'ar' ? 'حفظ التحدي' : 'Save Challenge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {adviceModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-gradient-to-b from-indigo-900 to-navy-dark w-full max-w-sm rounded-[32px] p-1 border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-[zoomIn_0.2s_ease-out]">
            <div className="bg-navy-light rounded-[30px] p-6 h-full relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
               <div className="flex justify-between items-center mb-6 relative z-10">
                 <div className="flex items-center gap-2">
                   <div className="bg-indigo-500/20 p-2 rounded-full text-indigo-400">
                     <Sparkles size={20} />
                   </div>
                   <h3 className="text-white font-bold">{language === 'ar' ? 'مستشارك المالي' : 'Financial Advisor'}</h3>
                 </div>
                 <button onClick={() => setAdviceModal(null)} className="text-slate-400 hover:text-white p-1">
                   <X size={20} />
                 </button>
               </div>

               <div className="relative z-10 min-h-32 flex items-center justify-center text-center">
                 {adviceLoading ? (
                   <div className="flex flex-col items-center gap-4 py-6">
                     <Loader2 className="animate-spin text-indigo-400" size={32} />
                     <p className="text-slate-400 text-sm animate-pulse">{language === 'ar' ? 'جاري تحليل بياناتك وتقديم النصيحة...' : 'Analyzing your data and preparing advice...'}</p>
                   </div>
                 ) : (
                   <p className="text-slate-200 leading-relaxed font-medium text-lg">
                     {adviceText}
                   </p>
                 )}
               </div>
               
               {!adviceLoading && (
                 <button 
                  onClick={() => setAdviceModal(null)}
                  className="w-full mt-8 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-500/20"
                 >
                   {language === 'ar' ? 'فهمت' : 'Got it'}
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
