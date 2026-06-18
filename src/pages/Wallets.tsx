import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Wallet as WalletIcon,
  Smartphone,
  Building,
  RefreshCw,
  HandCoins,
  X,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronDown,
  Eye,
  Lock,
  Edit2,
  List,
  MinusCircle,
  PlusCircle,
  FolderInput
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCategories } from "../context/CategoriesContext";
import TransactionDetailsModal from "../components/TransactionDetailsModal";

export default function Wallets() {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Bank");
  const [newBalance, setNewBalance] = useState("");
  const [newCurrency, setNewCurrency] = useState("USD");
  const [newColor, setNewColor] = useState("#00C9A7");
  const [saving, setSaving] = useState(false);

  const [viewingWalletTxs, setViewingWalletTxs] = useState<any | null>(null);
  const [selectedWalletMenu, setSelectedWalletMenu] = useState<any | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Actions
  const [actionModal, setActionModal] = useState<'withdraw' | 'add_balance' | 'transfer' | 'edit' | null>(null);
  const [actionWallet, setActionWallet] = useState<any>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionTargetWalletId, setActionTargetWalletId] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('Bank');

  const fetchWallets = async () => {

    try {
      setLoading(true);
      const res = await fetch("/api/wallets");
      const json = await res.json();
      if (json.success) setWallets(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransactions = async (walletId: string) => {
    try {
      setLoadingTxs(true);
      const res = await fetch(`/api/wallets/${walletId}/transactions`);
      const json = await res.json();
      if (json.success) {
        setWalletTransactions(json.data);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingTxs(false);
    }
  };

  const handleWalletClick = (wallet: any) => {
    setSelectedWalletMenu(wallet);
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleAddWallet = async () => {
    if (!newName || !newBalance) return;
    try {
      setSaving(true);
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          type: newType,
          balance: parseFloat(newBalance) || 0,
          currency: newCurrency,
          color: newColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWallets([data.wallet, ...wallets]);
        setShowAddForm(false);
        setNewName("");
        setNewBalance("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openAction = (action: 'withdraw' | 'add_balance' | 'transfer' | 'edit') => {
    setActionModal(action);
    setActionWallet(selectedWalletMenu);
    setSelectedWalletMenu(null);
    setActionAmount('');
    setActionTargetWalletId(wallets.filter((w) => w.id !== selectedWalletMenu?.id)[0]?.id || '');
    setActionNote('');
    if (action === 'edit' && selectedWalletMenu) {
       setEditName(selectedWalletMenu.name);
       setEditType(selectedWalletMenu.type);
       setNewColor(selectedWalletMenu.color);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionWallet) return;
    setSaving(true);
    try {
      if (actionModal === 'withdraw' || actionModal === 'add_balance') {
        const type = actionModal === 'withdraw' ? 'expense' : 'income';
        const tx = { type, amount: parseFloat(actionAmount), wallet: actionWallet.id, note: actionNote, category: 'General' };
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx)
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.message);
          return;
        }
      } else if (actionModal === 'transfer') {
        if (!actionTargetWalletId) return;
        const tx1 = { type: 'expense', amount: parseFloat(actionAmount), wallet: actionWallet.id, note: `Transfer to ${wallets.find(w=>w.id===actionTargetWalletId)?.name}`, category: 'Transfer' };
        const tx2 = { type: 'income', amount: parseFloat(actionAmount), wallet: actionTargetWalletId, note: `Transfer from ${actionWallet.name}`, category: 'Transfer' };
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: [tx1, tx2] })
        });
        const json = await res.json();
        if (!json.success) {
          alert(json.message);
          return;
        }
      } else if (actionModal === 'edit') {
        await fetch(`/api/wallets/${actionWallet.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName, type: editType, color: newColor })
        });
      }
      await fetchWallets();
      setActionModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (type: string, color: string) => {
    const props = { size: 24, className: "text-white" };
    switch (type) {
      case "Bank":
        return <Building {...props} />;
      case "Cash":
        return <HandCoins {...props} />;
      case "Digital Wallet":
        return <Smartphone {...props} />;
      default:
        return <WalletIcon {...props} />;
    }
  };

  const getCategoryDetails = (id: string) => {
    if (id.includes(':')) {
       const [mainId, subId] = id.split(':');
       const mainCat = categories.find(c => c.id === mainId);
       const subCat = mainCat?.subCategories.find(s => s.id === subId);
       return {
         name: subCat ? subCat.name[language] : mainCat ? mainCat.name[language] : id,
         icon: subCat ? subCat.icon : mainCat ? mainCat.icon : '🏷️',
       };
    } else {
       const cat = categories.find(c => c.id === id);
       return {
         name: cat ? cat.name[language] : id,
         icon: cat ? cat.icon : '🏷️',
       };
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-teal animate-pulse">
        <RefreshCw size={32} className="animate-spin" />
      </div>
    );
  }

  const totalBalance = wallets
    .filter(w => !w.isHidden)
    .reduce(
      (acc, w) => acc + (w.currency === "USD" ? w.balance : w.balance / 50),
      0,
    ); // Mock conversion for total excluding hidden ones

  if (viewingWalletTxs) {
    return (
      <div className="p-6 space-y-6 relative h-full overflow-y-auto pb-32 bg-navy text-white">
        <div className="flex items-center gap-4 border-slate-800 border-b pb-4">
          <button onClick={() => setViewingWalletTxs(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400">
            <ChevronLeft size={24} className="transform rtl:rotate-180" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: viewingWalletTxs.color }}>
               {getIcon(viewingWalletTxs.type, viewingWalletTxs.color)}
             </div>
             <div>
               <h2 className="font-bold leading-tight">{viewingWalletTxs.name}</h2>
               <p className="text-xs text-slate-400">{viewingWalletTxs.balance.toLocaleString()} {viewingWalletTxs.currency}</p>
             </div>
          </div>
        </div>
        
        <h3 className="font-bold text-slate-200 mt-6 mb-4">{t('recent_transactions')}</h3>
        
        {loadingTxs ? (
          <div className="flex justify-center p-8 text-teal"><RefreshCw size={24} className="animate-spin"/></div>
        ) : (
          <div className="space-y-3">
            {walletTransactions.map((tx: any) => {
              const catDetails = getCategoryDetails(tx.category);
              return (
              <div
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
                className="flex items-center p-4 bg-navy-light rounded-2xl border border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 flex items-center justify-center text-2xl">
                  {catDetails.icon}
                </div>
                <div className="ml-4 rtl:ml-0 rtl:mr-4 flex-1">
                  <p className="font-semibold text-sm text-slate-100 flex items-center gap-1">
                    {catDetails.name}
                    {tx.type === "expense" ? (
                      <ArrowDownRight size={14} className="text-red-400" />
                    ) : (
                      <ArrowUpRight size={14} className="text-teal" />
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tx.merchant || tx.note || tx.date}
                  </p>
                </div>
                <div
                  className={[
                    "text-right rtl:text-left font-bold border border-transparent",
                    tx.type === "expense" ? "text-white rtl:border-transparent cursor-default" : "text-teal rtl:border-transparent cursor-default"
                  ].join(" ")}
                >
                  {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                </div>
              </div>
            )})}
            {walletTransactions.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">
                {language === 'ar' ? 'لا توجد معاملات لهذه المحفظة.' : 'No transactions for this wallet.'}
              </p>
            )}
          </div>
        )}

        {selectedTransaction && (
          <TransactionDetailsModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative h-full overflow-y-auto pb-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          {t('wallets')}
        </h2>
        <button onClick={() => setShowAddForm(true)} className="text-teal bg-teal/10 p-2 rounded-xl hover:bg-teal/20 transition">
          <Plus size={24} />
        </button>
      </div>

      <div className="bg-navy-light rounded-3xl p-6 shadow-lg border border-slate-800 flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">
             {language === 'ar' ? 'إجمالي الرصيد (تقريبي دولار)' : 'Total Balance (Est. USD)'}
          </p>
          <h2 className="text-3xl font-bold text-white">
            $
            {totalBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
        </div>
        <div className="w-12 h-12 bg-teal/20 rounded-full flex items-center justify-center text-teal">
          <CreditCard size={24} />
        </div>
      </div>

      <div className="space-y-4">
        {wallets.map((wallet: any) => (
          <div
            key={wallet.id}
            onClick={() => handleWalletClick(wallet)}
            className={`rounded-3xl p-5 relative overflow-hidden text-white shadow-lg cursor-pointer transition-transform active:scale-[0.98] ${
              wallet.type === 'Cash' || wallet.color === '#6366f1' ? 'bg-gradient-to-br from-indigo-500 to-purple-700' :
              wallet.type === 'Bank' || wallet.color === '#3b82f6' ? 'bg-gradient-to-br from-blue-500 to-blue-800' :
              'bg-gradient-to-br from-emerald-500 to-teal-700'
            }`}
          >
            {/* Abstract background shapes */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start mb-6 relative z-10 w-full">
              <div className="text-white/80">
                <ChevronDown size={20} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm flex items-center gap-1.5">
                  {wallet.name}
                  {wallet.isLocked && <Lock size={12} className="text-red-300 animate-pulse fill-red-300" />}
                </span>
                <div className="p-1.5 bg-white/10 rounded-full backdrop-blur-sm">
                  {getIcon(wallet.type, '')}
                </div>
              </div>
            </div>

            <div className="relative z-10 mb-4 px-2">
              <div className="flex items-baseline gap-1.5 mb-1 rtl:flex-row-reverse rtl:justify-end">
                <span className="text-white/80 text-sm font-medium">{wallet.currency}</span>
                <span className="text-4xl font-bold tracking-tight">
                  {wallet.isHidden ? (
                    "••••••"
                  ) : (
                    wallet.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  )}
                </span>
              </div>
              <div className="text-white/70 text-xs text-left rtl:text-right">
                {language === 'ar' ? 'الرصيد المتاح' : 'Available Balance'}
              </div>
            </div>

            <div className="flex justify-end gap-6 relative z-10 px-2 pb-1">
              {/* Toggle Hiding balance */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const updatedIsHidden = !wallet.isHidden;
                    const res = await fetch(`/api/wallets/${wallet.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isHidden: updatedIsHidden })
                    });
                    const json = await res.json();
                    if (json.success) {
                      setWallets(wallets.map(w => w.id === wallet.id ? { ...w, isHidden: updatedIsHidden } : w));
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`p-2 rounded-xl backdrop-blur-sm transition-all hover:scale-110 ${wallet.isHidden ? 'bg-white/10 text-white/40' : 'bg-white/20 text-white'}`}
                title={wallet.isHidden ? (language === 'ar' ? 'إظهار المحفظة' : 'Show wallet') : (language === 'ar' ? 'إخفاء المحفظة' : 'Hide wallet')}
              >
                {wallet.isHidden ? (
                  <div className="relative">
                    <Eye size={20} className="line-through text-red-300 opacity-60" />
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-400 rotate-45 transform origin-center"></div>
                  </div>
                ) : (
                  <Eye size={20} />
                )}
              </button>

              {/* Toggle Locking Wallet */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const updatedIsLocked = !wallet.isLocked;
                    const res = await fetch(`/api/wallets/${wallet.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isLocked: updatedIsLocked })
                    });
                    const json = await res.json();
                    if (json.success) {
                      setWallets(wallets.map(w => w.id === wallet.id ? { ...w, isLocked: updatedIsLocked } : w));
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`p-2 rounded-xl backdrop-blur-sm transition-all hover:scale-110 ${wallet.isLocked ? 'bg-red-500/35 text-red-100 border border-red-500/20' : 'bg-white/20 text-white'}`}
                title={wallet.isLocked ? (language === 'ar' ? 'إلغاء قفل المحفظة' : 'Unlock wallet') : (language === 'ar' ? 'قفل المحفظة لمنع الصرف' : 'Lock wallet')}
              >
                <Lock size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed max-w-md mx-auto inset-0 bg-navy/90 backdrop-blur-sm z-50 p-6 flex flex-col justify-start pt-10">
          <div className="bg-navy-light border border-slate-700 p-6 rounded-3xl w-full max-w-sm mx-auto shadow-2xl relative">
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">{language === 'ar' ? 'إضافة محفظة' : 'Add Wallet'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'اسم المحفظة' : 'Wallet Name'}</label>
                <input type="text" value={newName} onChange={(e)=>setNewName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" />
              </div>
              <div className="flex gap-4">
                 <div className="flex-1">
                  <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'الرصيد' : 'Balance'}</label>
                  <input type="number" value={newBalance} onChange={(e)=>setNewBalance(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" />
                 </div>
                 <div className="flex-1">
                  <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'العملة' : 'Currency'}</label>
                  <select value={newCurrency} onChange={(e)=>setNewCurrency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none">
                    <option value="USD">USD</option>
                    <option value="EGP">EGP</option>
                    <option value="EUR">EUR</option>
                    <option value="SAR">SAR</option>
                  </select>
                 </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'النوع' : 'Type'}</label>
                <select value={newType} onChange={(e)=>setNewType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none">
                  <option value="Bank">{language === 'ar' ? 'حساب بنكي' : 'Bank'}</option>
                  <option value="Cash">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                  <option value="Digital Wallet">{language === 'ar' ? 'محفظة رقمية' : 'Digital Wallet'}</option>
                </select>
              </div>

              <button
                onClick={handleAddWallet}
                disabled={saving || !newName || !newBalance}
                className="w-full mt-4 bg-teal text-navy-dark font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : null}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedWalletMenu && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-navy-light rounded-3xl border border-slate-800 p-6 w-full max-w-md shadow-2xl relative animate-[scaleIn_0.2s_ease-out] overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedWalletMenu(null)} 
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded-xl transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-bold text-lg text-white mb-6 text-center">
              {language === 'ar' ? `خيارات محفظة: ${selectedWalletMenu.name}` : `Wallet Options: ${selectedWalletMenu.name}`}
            </h3>
            
            <div className="space-y-2">
              {/* Withdraw */}
              <button 
                onClick={() => openAction('withdraw')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-2xl transition bg-navy/40 border border-slate-800/50"
              >
                <span className="font-semibold text-slate-200">{language === 'ar' ? 'سحب رصيد' : 'Withdraw Balance'}</span>
                <div className="w-9 h-9 bg-teal/10 text-teal rounded-full flex items-center justify-center shrink-0">
                  <MinusCircle size={18} />
                </div>
              </button>

              {/* Add Balance */}
              <button 
                onClick={() => openAction('add_balance')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-2xl transition bg-navy/40 border border-slate-800/50"
              >
                <span className="font-semibold text-slate-200">{language === 'ar' ? 'إضافة رصيد' : 'Add Balance'}</span>
                <div className="w-9 h-9 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                  <PlusCircle size={18} />
                </div>
              </button>

              {/* Transfer */}
              <button 
                onClick={() => openAction('transfer')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-2xl transition bg-navy/40 border border-slate-800/50"
              >
                <span className="font-semibold text-slate-200">{language === 'ar' ? 'تحويل رصيد بين المحافظ' : 'Transfer Between Wallets'}</span>
                <div className="w-9 h-9 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <RefreshCw size={18} />
                </div>
              </button>
              
              <div className="h-px bg-slate-800 my-2"></div>

              {/* View Transactions */}
              <button 
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-2xl transition bg-navy/40 border border-slate-800/50"
                onClick={() => {
                  setViewingWalletTxs(selectedWalletMenu);
                  fetchWalletTransactions(selectedWalletMenu.id);
                  setSelectedWalletMenu(null);
                }}
              >
                <span className="font-semibold text-slate-200">{language === 'ar' ? 'عرض المعاملات' : 'View Transactions'}</span>
                <div className="w-9 h-9 bg-slate-500/10 text-slate-500 rounded-full flex items-center justify-center shrink-0">
                  <List size={18} />
                </div>
              </button>

              {/* Edit */}
              <button 
                onClick={() => openAction('edit')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800 rounded-2xl transition bg-navy/40 border border-slate-800/50"
              >
                <span className="font-semibold text-slate-200">{language === 'ar' ? 'تعديل المحفظة' : 'Edit Wallet'}</span>
                <div className="w-9 h-9 bg-yellow-400/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">
                  <Edit2 size={18} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-navy-light rounded-3xl border border-slate-800 p-6 w-full max-w-md shadow-2xl relative animate-[scaleIn_0.2s_ease-out] overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-white text-right rtl:text-right">
                {actionModal === 'withdraw' ? (language === 'ar' ? 'سحب رصيد' : 'Withdraw Balance') :
                 actionModal === 'add_balance' ? (language === 'ar' ? 'إضافة رصيد' : 'Add Balance') :
                 actionModal === 'transfer' ? (language === 'ar' ? 'تحويل رصيد' : 'Transfer Balance') :
                 (language === 'ar' ? 'تعديل المحفظة' : 'Edit Wallet')}
              </h3>
              <button onClick={() => setActionModal(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-right rtl:text-right">
              {actionModal === 'edit' ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم المحفظة' : 'Wallet Name'}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal text-right rtl:text-right"
                  />
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal"
                  >
                    <option value="Bank">{language === 'ar' ? 'حساب بنكي' : 'Bank Account'}</option>
                    <option value="Cash">{language === 'ar' ? 'نقدي' : 'Cash'}</option>
                    <option value="Digital Wallet">{language === 'ar' ? 'محفظة رقمية' : 'Digital Wallet'}</option>
                  </select>
                  <div className="flex gap-3 justify-center">
                    {['#00C9A7', '#6366f1', '#3b82f6', '#FFD166', '#EF476F'].map(color => (
                       <button
                         key={color}
                         onClick={() => setNewColor(color)}
                         className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${newColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-navy-light' : ''}`}
                         style={{ backgroundColor: color }}
                       />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    value={actionAmount}
                    onChange={e => setActionAmount(e.target.value)}
                    placeholder={language === 'ar' ? 'المبلغ' : 'Amount'}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal text-right rtl:text-right"
                  />
                  <input
                    type="text"
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder={language === 'ar' ? 'ملاحظة (اختياري)' : 'Note (Optional)'}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-teal text-right rtl:text-right"
                  />
                  {actionModal === 'transfer' && (
                    <select
                      value={actionTargetWalletId}
                      onChange={e => setActionTargetWalletId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal"
                    >
                      {wallets.filter(w => w.id !== actionWallet?.id).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}

              <button
                onClick={handleExecuteAction}
                disabled={saving || (actionModal !== 'edit' && !actionAmount)}
                className="w-full bg-teal text-navy-dark font-bold py-3 rounded-xl hover:bg-opacity-90 transition disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {saving && <RefreshCw className="animate-spin" size={18} />}
                {language === 'ar' ? 'تنفيذ' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
