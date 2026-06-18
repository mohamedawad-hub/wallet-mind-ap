import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Camera, Type, Loader2, Save, X, Zap, MessageSquare, Brain } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCategories } from "../context/CategoriesContext";

export default function AddTransaction() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { categories } = useCategories();
  const [activeTab, setActiveTab] = useState<"manual" | "voice" | "scan" | "sms">(
    "voice",
  );
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [parsedData, setParsedData] = useState<any>(null); // the object before saving
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const [smsText, setSmsText] = useState("");

  // For Voice handling
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // For File upload handling
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [wallets, setWallets] = useState<any[]>([]);

  // Conscience variables
  const [showConscience, setShowConscience] = useState(false);
  const [conscienceStep, setConscienceStep] = useState(0); // 0: initial question, 1: discussion, 2: saved result

  React.useEffect(() => {
    fetch('/api/wallets').then(res => res.json()).then(data => {
      if(data.success) setWallets(data.data);
    });
  }, []);

  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          await handleVoiceToExpense(base64Data);
        };
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(language === 'ar' ? "جاري الاستماع..." : "Listening...");
    } catch (err) {
      console.error(err);
      alert(language === 'ar' ? "تعذر الوصول للميكروفون" : "Could not access microphone");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTranscript(language === 'ar' ? "يتم المعالجة..." : "Processing...");
    }
  };

  const handleVoiceToExpense = async (audioBase64: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, categories }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.data) && data.data.length > 1) {
          setParsedTransactions(data.data);
          setActiveTab("manual");
        } else {
          setParsedData(Array.isArray(data.data) ? data.data[0] : data.data);
          setActiveTab("manual");
        }
        setTranscript("");
      } else {
        alert(data.message);
        setTranscript(language === 'ar' ? "فشل التعرف على الصوت" : "Failed to parse voice.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to parse voice.");
      setTranscript("");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];

        const res = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Data }),
        });

        const data = await res.json();
        if (data.success) {
          setParsedData(data.data);
          setAttachedImage(`data:image/jpeg;base64,${base64Data}`);
          setActiveTab("manual"); // Show result in manual form for edit
        } else {
          alert(data.message);
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      alert("Failed to parse image.");
      setLoading(false);
    }
  };

  const addTag = () => {
    if(tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleSmsParse = async () => {
    if (!smsText.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/parse-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: smsText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedData(data.data);
        setActiveTab("manual");
        setSmsText("");
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert(language === 'ar' ? 'فشل القراءة' : 'Failed to parse');
    } finally {
      setLoading(false);
    }
  };

  const confirmAndSave = async (skipConscience: boolean | React.MouseEvent = false) => {
    if (!parsedData) return;
    
    // Conscience Check for large expenses
    if (
      skipConscience !== true &&
      parsedData.type === 'expense' && 
      parsedData.amount > 4000
    ) {
      setShowConscience(true);
      setConscienceStep(0);
      return;
    }

    // Check for recent duplicate
    const recents = parsedTransactions;
    const isDuplicate = recents.some(r => r.amount === parsedData.amount && r.category === parsedData.category && new Date().getTime() - new Date(r.date).getTime() < 86400000);
    
    if (isDuplicate) {
      if(!confirm(language === 'ar' ? 'يوجد عملية مشابهة جداً مسجلة مؤخراً. هل أنت متأكد من الإضافة؟' : 'A very similar transaction was added recently. Are you sure?')) {
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsedData, source: activeTab, tags, attachedImage }),
      });
      const json = await res.json();
      if (json.success) {
        navigate("/"); // redirect to dashboard
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConsciousDecision = async (decision: 'saved' | 'bought', action: string) => {
    try {
      await fetch('/api/conscious-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedData.amount,
          currency: parsedData.currency,
          category: parsedData.category,
          decision,
          action
        })
      });
      if (decision === 'saved') {
        setConscienceStep(2); // Show success celebration
      } else {
        setShowConscience(false);
        confirmAndSave(true); // skip conscience and save
      }
    } catch (e) {
      console.error(e);
      setShowConscience(false);
      confirmAndSave(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy relative pt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pb-4 border-b border-navy-light">
        <h2 className="text-xl font-bold text-white">{language === 'ar' ? 'إضافة معاملة' : 'Add Transaction'}</h2>
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col px-6 pt-6 pb-4 gap-3">
        {/* VIP AI Voice Tab */}
        <button
          onClick={() => setActiveTab("voice")}
          className={`w-full relative overflow-hidden py-4 px-4 flex items-center justify-between gap-2 rounded-2xl font-bold transition-all active:scale-[0.98] border ${
            activeTab === "voice"
              ? "bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] text-white"
              : "bg-navy-light border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50"
          }`}
        >
          {activeTab === "voice" && (
            <>
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl"></div>
            </>
          )}
          <div className="flex items-center gap-3 relative z-10">
            <div className={`p-2 rounded-xl transition-colors ${activeTab === 'voice' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Mic size={20} />
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <span className={`text-sm ${activeTab === "voice" ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-200" : ""}`}>
                {language === 'ar' ? 'إضافة معاملة بالصوت' : 'Voice Addition'}
              </span>
              <span className={`text-[11px] font-medium flex items-center gap-1 ${activeTab === 'voice' ? 'text-purple-300' : 'text-slate-500'}`}>
                 <Zap size={10} className={activeTab === 'voice' ? 'text-yellow-400 fill-yellow-400' : ''} />
                 {language === 'ar' ? '٥ محاولات مجانية اليوم' : '5 free daily tries'}
              </span>
            </div>
          </div>
          <div className="relative z-10">
             <div className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${activeTab === 'voice' ? 'border-purple-500/50 bg-purple-500/30 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                <span className="relative flex h-2 w-2">
                  {activeTab === 'voice' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTab === 'voice' ? 'bg-purple-500' : 'bg-slate-500'}`}></span>
                </span>
                {language === 'ar' ? 'ذكي' : 'AI'}
             </div>
          </div>
        </button>

        {/* Regular Tabs: Manual & Scan */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] border ${
              activeTab === "manual"
                ? "bg-slate-800 border-teal/50 text-white shadow-[0_0_10px_rgba(0,201,167,0.1)]"
                : "bg-navy-light border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800/50"
            }`}
          >
            <Type size={16} className={activeTab === 'manual' ? 'text-teal' : ''} />
            {language === 'ar' ? 'إدخال يدوي' : 'Manual'}
          </button>

          <button
            onClick={() => setActiveTab("scan")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] border ${
              activeTab === "scan"
                ? "bg-slate-800 border-teal/50 text-white shadow-[0_0_10px_rgba(0,201,167,0.1)]"
                : "bg-navy-light border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800/50"
            }`}
          >
            <Camera size={16} className={activeTab === 'scan' ? 'text-teal' : ''} />
            {language === 'ar' ? 'تصوير' : 'Scan'}
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1 rounded-2xl text-[13px] font-semibold transition-all active:scale-[0.98] border ${
              activeTab === "sms"
                ? "bg-slate-800 border-teal/50 text-white shadow-[0_0_10px_rgba(0,201,167,0.1)]"
                : "bg-navy-light border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare size={14} className={activeTab === 'sms' ? 'text-teal' : ''} />
            {language === 'ar' ? 'رسالة' : 'SMS'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {loading && (
          <div className="absolute inset-0 z-10 bg-navy/80 backdrop-blur-sm flex flex-col items-center justify-center pb-32">
            <Loader2 className="animate-spin text-teal mb-4" size={40} />
            <p className="text-teal font-medium animate-pulse">
              {language === 'ar' ? 'جاري التحليل بالذكاء الاصطناعي...' : 'Processing with WalletMind AI...'}
            </p>
          </div>
        )}

        {/* VOICE TAB */}
        {activeTab === "voice" && !parsedData && (
          <div className="h-full flex flex-col items-center pt-10">
            <div className="flex-1 flex flex-col justify-center items-center w-full">
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={[
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
                  isRecording
                    ? "bg-red-500 scale-110 shadow-red-500/30"
                    : "bg-teal shadow-teal/30 hover:scale-105",
                ].join(" ")}
              >
                <Mic
                  size={48}
                  className={isRecording ? "text-white" : "text-navy-dark"}
                />
              </button>

              <p className="mt-8 text-center text-slate-400 min-h-16 text-lg">
                {transcript || (
                  <span className="text-sm">
                    {language === 'ar' ? 'اضغط وتحدث بشكل طبيعي.' : 'Tap to speak naturally.'}
                    <br />
                    <em className="opacity-60 text-xs">
                      {language === 'ar' ? '"صرفت 500 جنيه على الماركت النهاردة"' : '"I spent 500 EGP on groceries today"'}
                    </em>
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* SMS TAB */}
        {activeTab === "sms" && !parsedData && (
          <div className="h-full flex flex-col items-center pt-5 w-full">
            <div className="w-full bg-navy-light rounded-3xl p-5 border border-slate-800">
              <h3 className="font-bold text-white mb-2">{language === 'ar' ? 'لصق رسالة (SMS)' : 'Paste SMS'}</h3>
              <p className="text-xs text-slate-400 mb-4">
                {language === 'ar' ? 'قم بلصق نص الرسالة البنكية أو المحفظة الذكية هنا.' : 'Paste your bank or mobile wallet SMS message here.'}
              </p>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: تم خصم مبلغ 500 جنيه من حسابك في ستاربكس...' : 'E.g. 500 EGP was deducted from your account at Starbucks...'}
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-teal mb-4 resize-none"
              ></textarea>
              <button
                onClick={handleSmsParse}
                disabled={loading || !smsText.trim()}
                className="w-full bg-teal text-navy-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                {language === 'ar' ? 'قراءة الرسالة واستخراج المعاملة' : 'Parse SMS & Extract Transaction'}
              </button>
            </div>
          </div>
        )}

        {/* SCAN TAB */}
        {activeTab === "scan" && !parsedData && (
          <div className="h-full flex flex-col items-center pt-10">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm aspect-[3/4] border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:border-teal/50 hover:bg-teal/5 transition-colors cursor-pointer group"
            >
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-teal group-hover:bg-teal/10 transition-colors mb-4">
                <Camera size={36} />
              </div>
              <p className="font-semibold text-slate-300">
                {language === 'ar' ? 'اضغط لمسح إيصال' : 'Tap to Scan Receipt'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {language === 'ar' ? 'الذكاء الاصطناعي سيستخرج الإجمالي، البائع، والتاريخ' : 'AI will extract total, merchant & date'}
              </p>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 flex items-center gap-2 bg-[#25D366]/20 border border-[#25D366]/50 text-[#25D366] px-5 py-3 rounded-2xl hover:bg-[#25D366]/30 transition"
            >
               <MessageSquare size={18} />
               {language === 'ar' ? 'مشاركة صورة الفاتورة من واتساب' : 'Share Bill Image from WhatsApp'}
            </button>
          </div>
        )}

        {/* MANUAL / PREVIEW TAB */}
        {(activeTab === "manual" || parsedData || parsedTransactions.length > 0) && (
          <div className="space-y-5 mt-2 fade-in pb-10">
            {activeTab === "manual" && !parsedData && parsedTransactions.length === 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{language === 'ar' ? 'اختصارات سريعة' : 'Quick Shortcuts'}</h4>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                  {[
                    { label: language === 'ar' ? 'فطار' : 'Breakfast', amount: 50, category: 'Food & Dining', icon: '🍳', type: 'expense' },
                    { label: language === 'ar' ? 'مواصلات' : 'Transport', amount: 30, category: 'Transport', icon: '🚕', type: 'expense' },
                    { label: language === 'ar' ? 'قهوة' : 'Coffee', amount: 40, category: 'Food & Dining', icon: '☕', type: 'expense' },
                    { label: language === 'ar' ? 'راتب' : 'Salary', amount: 5000, category: 'Salary', icon: '💰', type: 'income' },
                  ].map((sc, index) => (
                    <button
                      key={index}
                      onClick={() => setParsedData({
                        amount: sc.amount,
                        type: sc.type,
                        category: sc.category,
                        note: sc.label,
                        currency: 'EGP',
                        date: new Date().toISOString().split('T')[0]
                      })}
                      className="flex bg-navy-light/50 border border-slate-700/50 hover:bg-slate-800 transition rounded-2xl p-3 items-center gap-3 min-w-[140px] snap-start"
                    >
                      <span className="text-2xl">{sc.icon}</span>
                      <div className="flex flex-col items-start pr-2">
                        <span className="text-sm font-bold text-slate-200">{sc.label}</span>
                        <span className="text-xs text-slate-400">{sc.amount} EGP</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {parsedTransactions.length > 0 ? (
              <>
                <div className="bg-teal/10 border border-teal/20 px-4 py-3 rounded-2xl mb-4">
                  <p className="text-xs text-teal font-medium flex items-center gap-1">
                    <Zap size={14} /> AI Extracted {parsedTransactions.length} Transactions
                  </p>
                </div>
                
                <div className="space-y-4">
                  {parsedTransactions.map((tx, idx) => (
                    <div key={idx} className="bg-navy-light p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">{tx.type === 'expense' ? '-' : '+'}${tx.amount} {tx.currency}</span>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">{tx.category || 'General'}</span>
                      </div>
                      <input 
                        type="text" 
                        value={tx.merchant || tx.note || ""} 
                        onChange={(e) => {
                          const newTxs = [...parsedTransactions];
                          if(tx.merchant !== undefined) newTxs[idx].merchant = e.target.value;
                          else newTxs[idx].note = e.target.value;
                          setParsedTransactions(newTxs);
                        }}
                        className="w-full bg-slate-800 text-white font-medium py-2 px-3 rounded-xl border border-slate-700 outline-none text-sm"
                        placeholder="Note..."
                      />
                      <select
                        value={tx.wallet || wallets[0]?.id || ""}
                        onChange={(e) => {
                          const newTxs = [...parsedTransactions];
                          newTxs[idx].wallet = e.target.value;
                          setParsedTransactions(newTxs);
                        }}
                        className="w-full bg-slate-800 text-slate-300 font-medium py-2 px-3 rounded-xl border border-slate-700 outline-none text-sm"
                      >
                        {wallets.map((w: any) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => {
                        setParsedTransactions([]);
                        setActiveTab("voice");
                    }}
                    className="flex-1 bg-slate-800 text-white font-bold text-sm py-4 rounded-2xl hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      await fetch("/api/transactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transactions: parsedTransactions.map(t => ({...t, source: 'voice'})) }),
                      });
                      navigate("/");
                    }}
                    className="flex-1 bg-teal text-navy-dark font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition shadow-[0_0_15px_rgba(0,201,167,0.3)]"
                  >
                    <Save size={18} />
                    Save All
                  </button>
                </div>
              </>
            ) : (
              <>
                {parsedData && (
                  <div className="bg-teal/10 border border-teal/20 px-4 py-3 rounded-2xl mb-4">
                    <p className="text-xs text-teal font-medium flex items-center gap-1">
                      <Zap size={14} /> AI Extracted Data (Confidence:{" "}
                      {((parsedData.confidence || 1) * 100).toFixed(0)}%)
                    </p>
                  </div>
                )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Amount
                </label>
                <div className="flex items-center">
                  <span className="text-3xl text-slate-400 mr-2">$</span>
                  <input
                    type="number"
                    value={parsedData?.amount || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full bg-transparent text-4xl font-bold text-white outline-none placeholder:text-slate-700"
                  />
                  <select
                    value={parsedData?.currency || "USD"}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, currency: e.target.value })
                    }
                    className="ml-2 bg-slate-800 text-sm py-2 px-3 rounded-xl border border-slate-700 outline-none"
                  >
                    <option>USD</option>
                    <option>EGP</option>
                    <option>SAR</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Type
                  </label>
                  <select
                    value={parsedData?.type || "expense"}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, type: e.target.value })
                    }
                    className="w-full bg-transparent text-white font-medium outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Category
                  </label>
                  <select
                    value={parsedData?.category || categories[0]?.id || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, category: e.target.value })
                    }
                    className="w-full bg-slate-800 text-white font-medium py-2 px-3 rounded-xl border border-slate-700 outline-none"
                  >
                    {categories.map((c) => (
                      <optgroup key={c.id} label={`${c.icon} ${c.name[language]}`}>
                         <option value={c.id}>{c.icon} {c.name[language]}</option>
                         {c.subCategories.length > 0 && c.subCategories.map((sub) => (
                           <option key={sub.id} value={`${c.id}:${sub.id}`}>
                              &nbsp;&nbsp;&nbsp;{sub.icon} {sub.name[language]}
                           </option>
                         ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'ar' ? 'المحفظة' : 'Wallet'}
                </label>
                <select
                  value={parsedData?.wallet || wallets[0]?.id || ""}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, wallet: e.target.value })
                  }
                  className="w-full bg-slate-800 text-white font-medium py-2 px-3 rounded-xl border border-slate-700 outline-none"
                >
                  {wallets.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={
                    parsedData?.date || new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setParsedData({ ...parsedData, date: e.target.value })
                  }
                  className="w-full bg-transparent text-white font-medium outline-none"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              {/* Recurring Option */}
              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={parsedData?.isRecurring || false}
                    onChange={(e) => setParsedData({ ...parsedData, isRecurring: e.target.checked, recurringDay: e.target.checked ? 1 : undefined })}
                    className="w-5 h-5 rounded border-slate-600 bg-navy text-teal focus:ring-teal/50 focus:ring-offset-0 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-white">
                    {language === 'ar' ? 'تكرار المعاملة شهرياً' : 'Repeat monthly'}
                  </span>
                </label>
                
                {parsedData?.isRecurring && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                      {language === 'ar' ? 'يوم الخصم في الشهر' : 'Day of the month'}
                    </label>
                    <div className="flex items-center">
                      <select
                        value={parsedData?.recurringDay || 1}
                        onChange={(e) => setParsedData({ ...parsedData, recurringDay: parseInt(e.target.value) })}
                        className="w-full bg-slate-800 text-white font-medium py-2 px-3 rounded-xl border border-slate-700 outline-none"
                      >
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Merchant / Note
                </label>
                <input
                  type="text"
                  value={parsedData?.merchant || parsedData?.note || ""}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, merchant: e.target.value })
                  }
                  className="w-full bg-transparent text-white outline-none"
                  placeholder="Receipt info or notes..."
                />
              </div>

              {/* Tags Section */}
              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block flex justify-between items-center">
                  <span>{language === 'ar' ? 'الوسوم (Tags)' : 'Tags'}</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-800 text-teal px-2 py-1 flex items-center gap-1 rounded-md text-xs font-medium border border-teal/20">
                      {t}
                      <button onClick={() => removeTag(t)} className="text-slate-400 hover:text-white rounded-full">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder={language === 'ar' ? 'أضف وسم جديد واضغط Enter' : 'Add new tag and press Enter'}
                    className="w-full bg-slate-800 border-none rounded-xl text-white text-sm px-3 py-2 outline-none focus:ring-1 focus:ring-teal"
                  />
                  <button onClick={addTag} className="bg-teal text-navy-dark px-3 rounded-xl hover:opacity-90 font-bold">+</button>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  {language === 'ar' ? 'المرفقات' : 'Attachments'}
                </label>
                {attachedImage ? (
                  <div className="relative inline-block mt-2">
                    <img src={attachedImage} alt="Attachment" className="w-24 h-24 object-cover rounded-xl border-2 border-slate-700" />
                    <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition shadow-lg">✕</button>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-teal hover:underline flex items-center gap-1 bg-teal/10 px-3 py-1.5 rounded-xl border border-teal/20">
                    <Camera size={14} /> {language === 'ar' ? 'إرفاق صورة إيصال' : 'Attach Receipt Image'}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Split Expense Section */}
              {parsedData?.type === 'expense' && (
                <div className="bg-navy-light p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-400">NEW</div>
                      {language === 'ar' ? 'مشاركة المصروف (Split)' : 'Split Expense'}
                    </label>
                    <input type="checkbox" className="w-4 h-4 accent-purple-500" />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{language === 'ar' ? 'قسّم التكلفة مع أصحابك (مثلاً: فاتورة المطعم).' : 'Divide the cost with friends (e.g. dinner bill).'}</p>
                  
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder={language === 'ar' ? 'اسم الصديق...' : 'Friend name...'} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                    <input type="number" placeholder={language === 'ar' ? 'المبلغ' : 'Amount'} className="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
                    <button className="bg-purple-600/30 text-purple-400 border border-purple-500/30 px-3 rounded-xl">+</button>
                  </div>
                </div>
              )}

            </div>

            <button
              onClick={confirmAndSave}
              className="w-full mt-6 bg-teal text-navy-dark font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-[0_0_15px_rgba(0,201,167,0.3)]"
            >
              <Save size={20} />
              Save Transaction
            </button>

            {parsedData && activeTab !== "manual" && (
              <button
                onClick={() => setParsedData(null)}
                className="w-full mt-2 text-slate-400 text-sm py-2"
              >
                Discard Context
              </button>
            )}
            </>
            )}
          </div>
        )}
      </div>

      {showConscience && (
        <div className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-gradient-to-b from-navy to-navy-dark w-full max-w-sm rounded-[2rem] border border-fuchsia-500/30 overflow-hidden shadow-2xl relative">
            <div className="p-6 relative z-10 text-center">
               <div className="mb-4 inline-block p-4 rounded-full bg-navy border border-fuchsia-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                 <Brain size={40} className="text-fuchsia-400 animate-pulse" />
               </div>
               
               {conscienceStep === 0 && (
                 <div className="animate-[fadeIn_0.5s_ease-out]">
                   <h3 className="text-xl font-bold text-white mb-2">{language === 'ar' ? 'هل دا ضروري دلوقتي؟' : 'Is this necessary right now?'}</h3>
                   <p className="text-slate-300 text-sm mb-6">{language === 'ar' ? 'أنت على وشك صرف مبلغ كبير، فكر ثانية.' : 'You are about to spend a large amount, think for a second.'}</p>
                   
                   <div className="space-y-3">
                     <button onClick={() => setConscienceStep(1)} className="w-full py-3.5 bg-fuchsia-500/20 text-fuchsia-300 font-bold rounded-xl border border-fuchsia-500/30 hover:bg-fuchsia-500/30 transition">
                       {language === 'ar' ? 'مش متأكد / لأ' : 'Not sure / No'}
                     </button>
                     <button onClick={() => { setShowConscience(false); confirmAndSave(true); }} className="w-full py-3.5 bg-navy-light text-slate-300 font-bold rounded-xl border border-slate-700 hover:bg-slate-800 transition">
                       {language === 'ar' ? 'أيوه ضروري' : 'Yes, necessary'}
                     </button>
                   </div>
                 </div>
               )}

               {conscienceStep === 1 && (
                 <div className="animate-[fadeIn_0.5s_ease-out]">
                   <h3 className="text-lg font-bold text-white mb-4">{language === 'ar' ? 'نقاش سريع بوعي' : 'Quick Conscious Chat'}</h3>
                   <ul className="text-sm text-slate-300 space-y-4 mb-6 text-left rtl:text-right bg-navy p-4 rounded-2xl border border-slate-700/50">
                     <li className="flex items-start gap-2">
                       <span className="text-fuchsia-400">•</span>
                       {language === 'ar' ? 'إيه اللي خلاك تفكر في الشراء دا؟ (ضغط ولا احتياج)' : 'What made you consider this? (stress or need)'}
                     </li>
                     <li className="flex items-start gap-2">
                       <span className="text-fuchsia-400">•</span>
                       {language === 'ar' ? 'هل في بديل أرخص يحقق نفس الهدف؟' : 'Is there a cheaper alternative?'}
                     </li>
                     <li className="flex items-start gap-2">
                       <span className="text-fuchsia-400">•</span>
                       {language === 'ar' ? 'لو أجّلته أسبوع، هل هيفرق؟' : 'If delayed a week, does it matter?'}
                     </li>
                   </ul>
                   
                   <div className="space-y-3">
                     <button onClick={() => handleConsciousDecision('saved', 'قرر عدم الشراء')} className="w-full py-3.5 bg-teal/20 text-teal font-bold rounded-xl border border-teal/30 hover:bg-teal/30 transition">
                       {language === 'ar' ? 'هأجّل أو هلغي الفكرة' : 'I will delay or cancel'}
                     </button>
                     <button onClick={() => handleConsciousDecision('bought', 'قرر الشراء بعد التفكير')} className="w-full py-3.5 bg-navy-light text-slate-300 font-bold rounded-xl border border-slate-700 hover:bg-slate-800 transition">
                       {language === 'ar' ? 'هكمل واشتري' : 'I will proceed to buy'}
                     </button>
                   </div>
                 </div>
               )}

               {conscienceStep === 2 && (
                 <div className="animate-[fadeIn_0.5s_ease-out] flex flex-col items-center">
                   <div className="w-16 h-16 bg-teal/20 text-teal rounded-full flex items-center justify-center mb-4">
                     <Zap size={32} />
                   </div>
                   <h3 className="text-2xl font-black text-white mb-2">{language === 'ar' ? 'عظيم جداً!' : 'Awesome!'}</h3>
                   <p className="text-slate-300 text-sm mb-6">
                     {language === 'ar' ? `وفّرت ${parsedData?.amount} ${parsedData?.currency} بوعيك. فخور بيك!` : `Saved ${parsedData?.amount} ${parsedData?.currency} consciously. Proud of you!`}
                   </p>
                   <button onClick={() => navigate('/')} className="w-full py-3.5 bg-teal text-navy-dark font-bold rounded-xl hover:bg-opacity-90 transition">
                     {language === 'ar' ? 'الرجوع للرئيسية' : 'Back to Dashboard'}
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


