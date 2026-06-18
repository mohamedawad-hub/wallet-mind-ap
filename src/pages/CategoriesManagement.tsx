import React, { useState } from 'react';
import { Plus, Trash, ArrowLeft, FolderPlus, Tag, Edit2, X, Save } from 'lucide-react';
import { useCategories } from '../context/CategoriesContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function CategoriesManagement() {
  const { categories, addCategory, addSubCategory, removeCategory, removeSubCategory, editCategory, editSubCategory } = useCategories();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');
  const [selectedMainCat, setSelectedMainCat] = useState<string>('');

  const [newCatEn, setNewCatEn] = useState('');
  const [newCatAr, setNewCatAr] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatPriority, setNewCatPriority] = useState('other');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editAr, setEditAr] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editPriority, setEditPriority] = useState('other');

  const handleAddMainCategory = () => {
    if (!newCatEn || !newCatAr) return;
    addCategory({
      name: { en: newCatEn, ar: newCatAr },
      icon: newCatIcon || '📁',
      type: 'expense',
      priority: newCatPriority,
      subCategories: []
    });
    setNewCatEn('');
    setNewCatAr('');
    setNewCatIcon('📁');
    setNewCatPriority('other');
  };

  const handleAddSubCategory = () => {
    if (!selectedMainCat || !newCatEn || !newCatAr) return;
    addSubCategory(selectedMainCat, {
      name: { en: newCatEn, ar: newCatAr },
      icon: newCatIcon || '📁',
      priority: newCatPriority,
    });
    setNewCatEn('');
    setNewCatAr('');
    setNewCatIcon('📁');
    setNewCatPriority('other');
  };

  const startEdit = (id: string, nameEn: string, nameAr: string, icon: string, priority?: string) => {
    setEditingId(id);
    setEditEn(nameEn);
    setEditAr(nameAr);
    setEditIcon(icon);
    setEditPriority(priority || 'other');
  };

  const saveEdit = (mainId: string, subId?: string) => {
    if (subId) {
      editSubCategory(mainId, subId, { name: { en: editEn, ar: editAr }, icon: editIcon, priority: editPriority });
    } else {
      editCategory(mainId, { name: { en: editEn, ar: editAr }, icon: editIcon, priority: editPriority });
    }
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-navy-dark overflow-y-auto w-full rtl:dir-rtl pt-5 px-6 pb-32">
      <div className="flex items-center gap-4 mb-6">
         <button onClick={() => navigate(-1)} className="w-10 h-10 bg-navy-light rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition">
            <ArrowLeft className="rtl:rotate-180" size={20} />
         </button>
         <h1 className="text-2xl font-bold text-white">{language === 'ar' ? 'إدارة الأقسام' : 'Manage Categories'}</h1>
      </div>

      <div className="flex bg-navy-light rounded-xl p-1 mb-6">
        <button
          className={[`flex-1 py-2 text-sm font-medium rounded-lg transition-all`, activeTab === 'main' ? 'bg-teal text-navy-dark' : 'text-slate-400'].join(' ')}
          onClick={() => setActiveTab('main')}
        >
          {language === 'ar' ? 'الأقسام الرئيسية' : 'Main Categories'}
        </button>
        <button
          className={[`flex-1 py-2 text-sm font-medium rounded-lg transition-all`, activeTab === 'sub' ? 'bg-teal text-navy-dark' : 'text-slate-400'].join(' ')}
          onClick={() => setActiveTab('sub')}
        >
          {language === 'ar' ? 'الأقسام الفرعية' : 'Sub Categories'}
        </button>
      </div>

      <div className="bg-navy-light border border-slate-800 rounded-2xl p-5 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {activeTab === 'main' ? <FolderPlus size={18} className="text-teal" /> : <Tag size={18} className="text-teal" />}
          {language === 'ar' ? (activeTab === 'main' ? 'إضافة قسم رئيسي' : 'إضافة قسم فرعي') : (activeTab === 'main' ? 'Add Main Category' : 'Add Sub Category')}
        </h3>

        {activeTab === 'sub' && (
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'اختر القسم الرئيسي' : 'Select Main Category'}</label>
            <select
              value={selectedMainCat}
              onChange={(e) => setSelectedMainCat(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none"
            >
              <option value="" disabled>{language === 'ar' ? 'اختر...' : 'Select...'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name[language]}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'الاسم (حروف إنجليزية)' : 'Name (English)'}</label>
            <input type="text" value={newCatEn} onChange={(e)=>setNewCatEn(e.target.value)} placeholder="e.g. Shopping" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'الاسم (حروف عربية)' : 'Name (Arabic)'}</label>
            <input type="text" value={newCatAr} onChange={(e)=>setNewCatAr(e.target.value)} placeholder="مثال: تسوق" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none" dir="rtl" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'أيقونة (إيموجي)' : 'Icon (Emoji)'}</label>
            <input type="text" value={newCatIcon} onChange={(e)=>setNewCatIcon(e.target.value)} placeholder="🛒" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none text-2xl" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{language === 'ar' ? 'الأولوية' : 'Priority'}</label>
            <select value={newCatPriority} onChange={(e)=>setNewCatPriority(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none">
              <option value="essential">{language === 'ar' ? 'أساسية' : 'Essential'}</option>
              <option value="entertainment">{language === 'ar' ? 'ترفيهية' : 'Entertainment'}</option>
              <option value="investment">{language === 'ar' ? 'استثمار' : 'Investment'}</option>
              <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
            </select>
          </div>

          <button
            onClick={activeTab === 'main' ? handleAddMainCategory : handleAddSubCategory}
            disabled={activeTab === 'sub' && !selectedMainCat}
            className="w-full mt-2 bg-teal text-navy-dark font-bold py-3 rounded-xl hover:bg-opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            {language === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">{language === 'ar' ? 'الأقسام الحالية' : 'Current Categories'}</h3>
        
        {categories.map((cat) => (
          <div key={cat.id} className="bg-navy-light rounded-2xl p-4 border border-slate-800/50">
            {editingId === cat.id ? (
              <div className="mb-3 space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={editEn} onChange={(e)=>setEditEn(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none" placeholder="En" />
                  <input type="text" value={editAr} onChange={(e)=>setEditAr(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none" placeholder="Ar" dir="rtl" />
                  <input type="text" value={editIcon} onChange={(e)=>setEditIcon(e.target.value)} className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-white outline-none" />
                  <select value={editPriority} onChange={(e)=>setEditPriority(e.target.value)} className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none text-xs">
                    <option value="essential">Ess.</option>
                    <option value="entertainment">Ent.</option>
                    <option value="investment">Inv.</option>
                    <option value="other">Oth.</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white p-2"><X size={16}/></button>
                  <button onClick={() => saveEdit(cat.id)} className="text-teal hover:text-white p-2"><Save size={16}/></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-semibold text-white">{cat.name[language]}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat.id, cat.name.en, cat.name.ar, cat.icon, cat.priority)} className="text-slate-400 hover:text-teal p-2 rounded-lg transition">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => removeCategory(cat.id)} className="text-slate-400 hover:text-red-400 p-2 rounded-lg transition">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {cat.subCategories.length > 0 && (
              <div className="pl-12 rtl:pl-0 rtl:pr-12 space-y-2 mt-2">
                {cat.subCategories.map((sub) => (
                  <div key={sub.id} className="bg-slate-800/30 p-2 rounded-lg">
                    {editingId === `${cat.id}-${sub.id}` ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input type="text" value={editEn} onChange={(e)=>setEditEn(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none text-sm" placeholder="En" />
                          <input type="text" value={editAr} onChange={(e)=>setEditAr(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none text-sm" placeholder="Ar" dir="rtl" />
                          <input type="text" value={editIcon} onChange={(e)=>setEditIcon(e.target.value)} className="w-12 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-white outline-none text-sm" />
                          <select value={editPriority} onChange={(e)=>setEditPriority(e.target.value)} className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1 text-white outline-none text-xs">
                            <option value="essential">E</option>
                            <option value="entertainment">T</option>
                            <option value="investment">I</option>
                            <option value="other">O</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white p-1"><X size={14}/></button>
                          <button onClick={() => saveEdit(cat.id, sub.id)} className="text-teal hover:text-white p-1"><Save size={14}/></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{sub.icon}</span>
                          <span className="text-sm text-slate-300">{sub.name[language]}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(`${cat.id}-${sub.id}`, sub.name.en, sub.name.ar, sub.icon, sub.priority)} className="text-slate-500 hover:text-teal p-1 rounded transition">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => removeSubCategory(cat.id, sub.id)} className="text-slate-500 hover:text-red-400 p-1 rounded transition">
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
