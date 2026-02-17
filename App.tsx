
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Plus, Search, X, History, Trash2, ArrowLeft, Pill, Info, Save, Star, Flag, Home, ChevronDown, ChevronRight, Settings, Edit2, Check, Syringe, ClipboardList, Database, Layers, ArrowUpDown, AlertTriangle, RotateCcw, Download, Upload, Cloud, Smartphone, Globe, Loader2 } from 'lucide-react';
import { Category, Medicine, MedicineDetails } from './types';

// DIL Logo Component
const DILLogo: React.FC<{ className?: string, color?: string }> = ({ className = "w-8 h-8", color = "currentColor" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="84" height="84" rx="20" stroke={color} strokeWidth="8" />
    <path 
      d="M32 44 L48 24 Q50 21 54 24 L72 46 Q75 50 71 54 L54 66 Q50 69 46 66 L32 50 Q28 46 32 44 Z" 
      stroke={color} 
      strokeWidth="6"
    />
    <path d="M70 65 Q74 76 70 76 T66 76 Q62 76 66 65 Z" fill={color} />
    <path d="M8 68 L92 68 L92 78 Q92 92 78 92 L22 92 Q8 92 8 78 Z" fill={color} />
    <text x="16" y="86" fontSize="11" fontWeight="900" fill="white" fontFamily="Arial Black, Helvetica, sans-serif">DRUG</text>
  </svg>
);

const MedicineIcon: React.FC<{ type?: string; className?: string }> = ({ type, className }) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('injection') || t.includes('inj') || t.includes('iv') || t.includes('im') || t.includes('vial')) return <Syringe className={className} />;
  if (t.includes('syrup') || t.includes('suspension') || t.includes('drop') || t.includes('liquid')) return <div className={`w-6 h-6 border-2 border-current rounded-t-lg rounded-b-sm relative flex items-center justify-center ${className}`}><div className="w-full h-1/2 bg-current absolute bottom-0 opacity-20"></div></div>;
  return <Pill className={className} />; 
};

const ConfirmDeleteModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string;
  message: string;
  confirmLabel?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm Delete" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#ED1C24]" />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-slate-500 font-medium mb-8 px-4">{message}</p>
          <div className="flex flex-col w-full space-y-3">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="w-full py-4 bg-[#ED1C24] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all"
            >
              {confirmLabel}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-gray-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest active:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DILWatermark: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center opacity-[0.08] z-0 select-none overflow-hidden p-6">
    <div className="flex flex-col items-center max-w-full">
      <div className="text-[#ED1C24] text-center font-black uppercase tracking-tighter leading-[0.85]">
        <div className="text-[12vw] sm:text-6xl md:text-8xl">Drug</div>
        <div className="text-[12vw] sm:text-6xl md:text-8xl">International</div>
        <div className="text-[12vw] sm:text-6xl md:text-8xl">Limited</div>
      </div>
    </div>
  </div>
);

const DEFAULT_CATEGORIES: Category[] = [
  'Code', 'Brand', 'Generic', 'Antibiotics', 'Cardiac', 'Vitamins', 'Indication'
];

const INITIAL_DATA: Medicine[] = [
  { id: 'm02', codeName: '02', fullName: 'MYSULIN 30/70(100 UNIT) 10ML', genericName: 'Isophane Insulin + Soluble Insulin', category: 'Cardiac', addedAt: Date.now(), type: 'Vial/Injection' },
  { id: 'm37', codeName: '37', fullName: 'TRIALON INJECTION', genericName: 'Triamcinolone', category: 'Brand', addedAt: Date.now(), type: 'Injection' },
  { id: 'mabs', codeName: 'ABS', fullName: 'ALBASINE TABLET', genericName: 'Albendazole', category: 'Brand', addedAt: Date.now(), type: 'Tablet' },
  { id: 'mazm', codeName: 'AZM', fullName: 'AZIMEX TABLET-500MG', genericName: 'Azithromycin', category: 'Antibiotics', addedAt: Date.now(), dosage: '500mg', type: 'Tablet' },
  { id: 'mbe2', codeName: 'BE2', fullName: 'BETALOC-25 TABLET', genericName: 'Metoprolol', category: 'Cardiac', addedAt: Date.now(), dosage: '25mg', type: 'Tablet' },
];

const App: React.FC = () => {
    // নতুন ব্যাকআপ ফাংশন
  const handleBackupToDevice = async () => {
    try {
      const dataToSave = JSON.stringify({
        medicines,
        categories,
        recycleBin,
        timestamp: new Date().toISOString()
      });

      await Filesystem.writeFile({
        path: 'dil_medicine_backup.json',
        data: dataToSave,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      alert("সফল! ব্যাকআপ ফাইলটি আপনার ফোনের Documents ফোল্ডারে সেভ হয়েছে।");
    } catch (error) {
      console.error('Backup error:', error);
      alert("ব্যাকআপ নিতে সমস্যা হয়েছে। স্টোরেজ পারমিশন চেক করুন।");
    }
  };
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [recycleBin, setRecycleBin] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'add' | 'edit' | 'settings'>('main');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [purgeId, setPurgeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    codeName: '',
    strength: '',
    form: '',
    category: '',
    unitPrice: '',
    packSize: ''
  });

  useEffect(() => {
    const savedMeds = localStorage.getItem('meddb_offline_data');
    if (savedMeds) {
      setMedicines(JSON.parse(savedMeds));
    } else {
      setMedicines(INITIAL_DATA);
      localStorage.setItem('meddb_offline_data', JSON.stringify(INITIAL_DATA));
    }

    const savedRecycle = localStorage.getItem('meddb_recycle_bin');
    if (savedRecycle) {
      setRecycleBin(JSON.parse(savedRecycle));
    }

    const savedCats = localStorage.getItem('meddb_categories');
    if (savedCats) {
      const parsedCats = JSON.parse(savedCats);
      setCategories(parsedCats);
      setActiveCategory(parsedCats[0] || '');
    } else {
      setCategories(DEFAULT_CATEGORIES);
      setActiveCategory(DEFAULT_CATEGORIES[0]);
      localStorage.setItem('meddb_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  const saveMedicines = (updated: Medicine[]) => {
    setMedicines(updated);
    localStorage.setItem('meddb_offline_data', JSON.stringify(updated));
  };

  const saveRecycleBin = (updated: Medicine[]) => {
    setRecycleBin(updated);
    localStorage.setItem('meddb_recycle_bin', JSON.stringify(updated));
  };

  const resetForm = () => {
    setFormData({ brandName: '', genericName: '', codeName: '', strength: '', form: '', category: activeCategory, unitPrice: '', packSize: '' });
  };

  const moveToDeleteBin = () => {
    if (!deleteId) return;
    const medicineToDelete = medicines.find(m => m.id === deleteId);
    if (medicineToDelete) {
      const updatedMeds = medicines.filter(m => m.id !== deleteId);
      const updatedBin = [medicineToDelete, ...recycleBin];
      saveMedicines(updatedMeds);
      saveRecycleBin(updatedBin);
    }
    if (selectedMedicine?.id === deleteId) setSelectedMedicine(null);
    if (editingMedicine?.id === deleteId) {
      setEditingMedicine(null);
      setCurrentView('main');
    }
    setDeleteId(null);
  };

  const restoreFromBin = (id: string) => {
    const medicineToRestore = recycleBin.find(m => m.id === id);
    if (medicineToRestore) {
      const updatedBin = recycleBin.filter(m => m.id !== id);
      const updatedMeds = [medicineToRestore, ...medicines];
      saveMedicines(updatedMeds);
      saveRecycleBin(updatedBin);
    }
  };

  const purgePermanently = () => {
    if (!purgeId) return;
    const updatedBin = recycleBin.filter(m => m.id !== purgeId);
    saveRecycleBin(updatedBin);
    setPurgeId(null);
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    const cName = formData.codeName.trim().toUpperCase();
    const fName = formData.brandName.trim();
    if (!cName || !fName) return;
    if (medicines.some(m => m.codeName.toUpperCase() === cName)) {
      alert(`Error: This code (${cName}) exists!`);
      return;
    }
    const newMed: Medicine = {
      id: Math.random().toString(36).substr(2, 9),
      codeName: cName,
      fullName: fName,
      category: formData.category || activeCategory,
      addedAt: Date.now(),
      dosage: formData.strength,
      type: formData.form,
      genericName: formData.genericName,
      unitPrice: formData.unitPrice ? (formData.unitPrice.includes('BDT') ? formData.unitPrice : `${formData.unitPrice} BDT`) : undefined,
      details: { packSize: formData.packSize }
    };
    saveMedicines([newMed, ...medicines]);
    resetForm();
    setCurrentView('main');
  };

  const handleUpdateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;
    const cName = formData.codeName.trim().toUpperCase();
    const fName = formData.brandName.trim();
    if (medicines.some(m => m.id !== editingMedicine.id && m.codeName.toUpperCase() === cName)) {
      alert(`Error: Duplicate code (${cName})!`);
      return;
    }
    const updatedMeds = medicines.map(m => m.id === editingMedicine.id ? {
      ...m,
      codeName: cName || m.codeName,
      fullName: fName || m.fullName,
      category: formData.category || m.category,
      dosage: formData.strength,
      type: formData.form,
      genericName: formData.genericName,
      unitPrice: formData.unitPrice ? (formData.unitPrice.includes('BDT') ? formData.unitPrice : `${formData.unitPrice} BDT`) : m.unitPrice,
      details: { ...m.details, packSize: formData.packSize }
    } : m);
    saveMedicines(updatedMeds);
    resetForm();
    setEditingMedicine(null);
    setCurrentView('main');
  };

  const startEditing = (med: Medicine) => {
    setEditingMedicine(med);
    setFormData({
      brandName: med.fullName,
      genericName: med.genericName || '',
      codeName: med.codeName,
      strength: med.dosage || '',
      form: med.type || '',
      category: med.category,
      unitPrice: med.unitPrice?.replace(' BDT', '') || '',
      packSize: med.details?.packSize || ''
    });
    setCurrentView('edit');
  };

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length === 1) return [];
    let list = [...medicines];
    if (activeCategory !== 'Code' && activeCategory !== 'Brand' && activeCategory !== 'Generic') {
        list = list.filter(m => m.category === activeCategory);
    }
    if (q.length >= 2) {
      list = list.filter(m => 
        m.codeName.toLowerCase().includes(q) || 
        m.fullName.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q)
      );
    }
    if (activeCategory === 'Code') {
      list.sort((a, b) => a.codeName.localeCompare(b.codeName));
    } else if (activeCategory === 'Brand') {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (activeCategory === 'Generic') {
      list.sort((a, b) => (a.genericName || '').localeCompare(b.genericName || ''));
    } else {
        list.sort((a, b) => b.addedAt - a.addedAt);
    }
    return list;
  }, [medicines, activeCategory, searchQuery]);

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <>
        <MedicineFormView 
          mode={currentView}
          medId={editingMedicine?.id}
          onBack={() => { setCurrentView('main'); setEditingMedicine(null); resetForm(); }} 
          onSubmit={currentView === 'add' ? handleAddMedicine : handleUpdateMedicine} 
          onDelete={setDeleteId}
          formData={formData} 
          setFormData={setFormData}
          categories={categories}
          medicines={medicines}
        />
        <ConfirmDeleteModal 
          isOpen={!!deleteId} 
          onClose={() => setDeleteId(null)} 
          onConfirm={moveToDeleteBin} 
          title="Move to Recycle Bin?"
          message="This medicine will be moved to the Recycle Bin. You can restore it later if needed."
        />
      </>
    );
  }

  if (currentView === 'settings') {
    return (
      <>
        <SettingsView 
          onBack={() => setCurrentView('main')} 
          categories={categories}
          medicines={medicines}
          recycleBin={recycleBin}
          onAddCategory={(name) => {
            const updated = [...categories, name];
            setCategories(updated);
            localStorage.setItem('meddb_categories', JSON.stringify(updated));
          }}
          onDeleteCategory={(name) => {
            if (['Code', 'Brand', 'Generic'].includes(name)) return;
            const updated = categories.filter(c => c !== name);
            setCategories(updated);
            localStorage.setItem('meddb_categories', JSON.stringify(updated));
          }}
          onDeleteMedicine={setDeleteId}
          onRestoreMedicine={restoreFromBin}
          onPurgeMedicine={setPurgeId}
          onImport={(data) => {
            if (data.medicines) saveMedicines(data.medicines);
            if (data.categories) setCategories(data.categories);
            if (data.recycleBin) saveRecycleBin(data.recycleBin);
            alert("Database Restored Successfully!");
          }}
        />
        <ConfirmDeleteModal 
          isOpen={!!deleteId} 
          onClose={() => setDeleteId(null)} 
          onConfirm={moveToDeleteBin} 
          title="Delete Entry?"
          message="Move this record to the Recycle Bin?"
          confirmLabel="Move to Bin"
        />
        <ConfirmDeleteModal 
          isOpen={!!purgeId} 
          onClose={() => setPurgeId(null)} 
          onConfirm={purgePermanently} 
          title="Purge Permanently?"
          message="This action cannot be undone. The medicine will be permanently deleted from storage."
        />
      </>
    );
  }

  if (selectedMedicine) {
    return (
      <>
        <MedicineDetailView 
          medicine={selectedMedicine} 
          allMedicines={medicines}
          onBack={() => setSelectedMedicine(null)} 
          onSelectMedicine={setSelectedMedicine}
          onEdit={() => startEditing(selectedMedicine)}
          onDelete={() => setDeleteId(selectedMedicine.id)}
        />
        <ConfirmDeleteModal 
          isOpen={!!deleteId} 
          onClose={() => setDeleteId(null)} 
          onConfirm={moveToDeleteBin} 
          title="Move to Bin?"
          message="Send this medicine information to the Recycle Bin?"
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent text-slate-800 select-none relative">
      <DILWatermark />
      <div className="bg-[#ED1C24] text-white safe-top pt-4 shadow-xl sticky top-0 z-40">
        <div className="px-4 flex items-center justify-between pb-4">
          <div className="flex items-center space-x-3 w-full">
            <DILLogo className="w-10 h-10 flex-none text-white drop-shadow-md" color="white" />
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-100 opacity-70" />
              </div>
              <input
                type="text"
                placeholder="search by code or name..."
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-slate-800 focus:outline-none transition-all shadow-inner bg-white/95"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center ml-2 space-x-1">
            <button onClick={() => setHistoryOpen(!historyOpen)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <History className="w-6 h-6" />
            </button>
            <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex bg-[#D0181F]/80 overflow-x-auto no-scrollbar scroll-smooth backdrop-blur-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setHistoryOpen(false); }}
              className={`flex-none min-w-[100px] px-4 py-3 text-sm font-bold italic transition-all border-r border-white/5 last:border-r-0 ${
                activeCategory === cat ? 'bg-white text-[#ED1C24] shadow-lg scale-105 z-10' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-3 pb-28 space-y-3 relative z-10">
        {historyOpen ? (
          <HistoryView medicines={medicines} onSelect={setSelectedMedicine} onEdit={startEditing} />
        ) : filteredMedicines.length > 0 ? (
          filteredMedicines.map((med) => (
            <div 
              key={med.id} 
              onClick={() => setSelectedMedicine(med)}
              className="bg-white/25 backdrop-blur-md rounded-xl shadow-sm border border-white/40 flex p-3 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/40"
            >
              <div className="w-14 h-14 flex-none flex items-center justify-center bg-white/60 rounded-xl border border-red-50 shadow-sm">
                <MedicineIcon type={med.type || med.fullName} className="w-8 h-8 text-[#ED1C24]" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-extrabold text-xl text-slate-900 leading-tight">{med.fullName}</h3>
                <div className="flex items-center space-x-2 mt-1">
                   <span className="text-xs text-[#ED1C24] font-black bg-white/80 px-2 py-0.5 rounded-full uppercase shadow-sm">{med.codeName}</span>
                </div>
                {med.genericName && (
                  <p className="text-xs text-gray-700 italic mt-2 font-bold line-clamp-1">{med.genericName}</p>
                )}
                <div className="flex items-center mt-3 text-[10px] text-gray-700 space-x-2 font-black uppercase tracking-widest">
                  {med.dosage && <span>{med.dosage}</span>}
                  {med.dosage && med.type && <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>}
                  {med.type && <span>{med.type}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center px-1 opacity-20 hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); startEditing(med); }} className="p-2 hover:bg-white rounded-full"><Edit2 className="w-5 h-5 text-slate-600" /></button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-center opacity-40">
            <Search className="w-20 h-20 mb-4 text-[#ED1C24]" />
            <p className="text-xl font-black text-[#ED1C24] uppercase tracking-tighter">No results found</p>
          </div>
        )}
      </main>
      <button 
        onClick={() => { resetForm(); setCurrentView('add'); }} 
        className="fixed bottom-10 right-8 bg-[#ED1C24] text-white p-5 rounded-2xl shadow-2xl z-50 flex items-center justify-center active:scale-90 active:rotate-45 transition-all"
      >
        <Plus className="w-9 h-9" />
      </button>
    </div>
  );
};

const MedicineFormView: React.FC<{ 
  mode: 'add' | 'edit', 
  medId?: string, 
  onBack: () => void, 
  onSubmit: (e: React.FormEvent) => void, 
  onDelete: (id: string) => void, 
  formData: any, 
  setFormData: any, 
  categories: Category[],
  medicines: Medicine[]
}> = ({ mode, medId, onBack, onSubmit, onDelete, formData, setFormData, categories, medicines }) => {
  const [showGenericSuggestions, setShowGenericSuggestions] = useState(false);
  const [showStrengthSuggestions, setShowStrengthSuggestions] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showFormSuggestions, setShowFormSuggestions] = useState(false);
  const [showPackSizeSuggestions, setShowPackSizeSuggestions] = useState(false);

  const uniqueGenerics = useMemo(() => Array.from(new Set(medicines.map(m => m.genericName?.trim()).filter(Boolean))).sort(), [medicines]);
  const uniqueStrengths = useMemo(() => Array.from(new Set(medicines.map(m => m.dosage?.trim()).filter(Boolean))).sort(), [medicines]);
  const uniqueBrands = useMemo(() => Array.from(new Set(medicines.map(m => m.fullName?.trim()).filter(Boolean))).sort(), [medicines]);
  const uniqueForms = useMemo(() => Array.from(new Set(medicines.map(m => m.type?.trim()).filter(Boolean))).sort(), [medicines]);
  const uniquePackSizes = useMemo(() => Array.from(new Set(medicines.map(m => m.details?.packSize?.trim()).filter(Boolean))).sort(), [medicines]);

  const isDuplicateCode = useMemo(() => {
    const cName = formData.codeName.trim().toUpperCase();
    if (!cName) return false;
    return medicines.some(m => m.id !== medId && m.codeName.toUpperCase() === cName);
  }, [formData.codeName, medicines, medId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const SuggestionBox = ({ items, onSelect, show }: { items: string[], onSelect: (s: string) => void, show: boolean }) => {
    if (!show || items.length === 0) return null;
    return (
      <div className="absolute z-[60] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-red-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
        {items.map((s, idx) => (
          <button 
            key={idx} type="button" 
            onClick={() => onSelect(s)}
            className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-red-50 border-b border-red-50 last:border-0"
          >
            {s}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f9fafb] animate-in slide-in-from-right duration-300 relative z-50">
      <div className="bg-[#ED1C24] text-white pt-4 pb-4 px-4 sticky top-0 z-10 flex items-center shadow-lg">
        <button onClick={onBack} className="p-1 active:bg-white/20 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="ml-6 text-xl font-black uppercase tracking-tight flex-1">{mode === 'add' ? 'Add New' : 'Edit Entry'}</h1>
        {mode === 'edit' && medId && (
          <button onClick={() => onDelete(medId)} className="p-2 active:bg-white/20 rounded-full text-white/90 hover:text-white"><Trash2 className="w-6 h-6" /></button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <form onSubmit={onSubmit} className="space-y-6 max-w-lg mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-xl">
            <h3 className="text-[#ED1C24] text-xs font-black uppercase tracking-widest mb-6 border-b border-red-50 pb-3">Medicine Identity</h3>
            <div className="space-y-5">
              <div>
                <input 
                  type="text" placeholder="CODE (e.g. BE2)" 
                  className={`w-full px-5 py-4 border rounded-2xl outline-none focus:ring-4 transition-all font-bold uppercase ${isDuplicateCode ? 'border-red-500 ring-red-500/10' : 'border-gray-200 focus:ring-red-500/10 focus:border-[#ED1C24]'}`} 
                  value={formData.codeName} onChange={(e) => handleInputChange('codeName', e.target.value.toUpperCase())} required 
                />
                {isDuplicateCode && <p className="mt-2 text-xs text-red-600 font-bold flex items-center animate-pulse"><AlertTriangle className="w-3 h-3 mr-1" /> Duplicate Code!</p>}
              </div>
              <div className="relative">
                <input 
                  type="text" placeholder="BRAND NAME" 
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#ED1C24] transition-all font-bold" 
                  value={formData.brandName} onChange={(e) => handleInputChange('brandName', e.target.value)} 
                  onFocus={() => setShowBrandSuggestions(true)} onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                  required 
                />
                <SuggestionBox 
                  items={uniqueBrands.filter(b => b.toLowerCase().includes(formData.brandName.toLowerCase()))} 
                  onSelect={(s) => setFormData({...formData, brandName: s})} 
                  show={showBrandSuggestions}
                />
              </div>
              <div className="relative">
                <input 
                  type="text" placeholder="GENERIC NAME" 
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#ED1C24] transition-all font-bold" 
                  value={formData.genericName} onChange={(e) => handleInputChange('genericName', e.target.value)} 
                  onFocus={() => setShowGenericSuggestions(true)} onBlur={() => setTimeout(() => setShowGenericSuggestions(false), 200)}
                />
                <SuggestionBox 
                  items={uniqueGenerics.filter(g => g.toLowerCase().includes(formData.genericName.toLowerCase()))} 
                  onSelect={(s) => setFormData({...formData, genericName: s})} 
                  show={showGenericSuggestions}
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-xl">
            <h3 className="text-[#ED1C24] text-xs font-black uppercase tracking-widest mb-6 border-b border-red-50 pb-3">Specs & Pricing</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="relative">
                <input type="text" placeholder="STRENGTH" className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none font-bold" value={formData.strength} onChange={(e) => setFormData({...formData, strength: e.target.value})} onFocus={() => setShowStrengthSuggestions(true)} onBlur={() => setTimeout(() => setShowStrengthSuggestions(false), 200)} />
                <SuggestionBox items={uniqueStrengths.filter(s => s.toLowerCase().includes(formData.strength.toLowerCase()))} onSelect={(s) => setFormData({...formData, strength: s})} show={showStrengthSuggestions} />
              </div>
              <div className="relative">
                <input type="text" placeholder="FORM" className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none font-bold" value={formData.form} onChange={(e) => setFormData({...formData, form: e.target.value})} onFocus={() => setShowFormSuggestions(true)} onBlur={() => setTimeout(() => setShowFormSuggestions(false), 200)} />
                <SuggestionBox items={uniqueForms.filter(f => f.toLowerCase().includes(formData.form.toLowerCase()))} onSelect={(f) => setFormData({...formData, form: f})} show={showFormSuggestions} />
              </div>
            </div>
            <div className="space-y-5">
              <div className="relative">
                <input type="text" placeholder="PACK SIZE" className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none font-bold" value={formData.packSize} onChange={(e) => setFormData({...formData, packSize: e.target.value})} onFocus={() => setShowPackSizeSuggestions(true)} onBlur={() => setTimeout(() => setShowPackSizeSuggestions(false), 200)} />
                <SuggestionBox items={uniquePackSizes.filter(p => p.toLowerCase().includes(formData.packSize.toLowerCase()))} onSelect={(p) => setFormData({...formData, packSize: p})} show={showPackSizeSuggestions} />
              </div>
              <input type="text" placeholder="UNIT PRICE (BDT)" className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none font-bold" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} />
              <div className="relative">
                <select className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none bg-white font-bold appearance-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="">SELECT CATEGORY</option>
                  {categories.map(cat => (cat !== 'Code' && cat !== 'Brand' && cat !== 'Generic') && <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-5 text-gray-300 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-center pb-16">
            <button type="submit" disabled={isDuplicateCode} className={`w-full py-5 rounded-2xl font-black text-xl shadow-2xl active:scale-[0.97] transition-all uppercase tracking-tight ${isDuplicateCode ? 'bg-gray-300 text-gray-500' : 'bg-[#ED1C24] text-white shadow-red-900/30'}`}>
              {isDuplicateCode ? 'Duplicate Code Found' : (mode === 'add' ? 'Create Entry' : 'Update Database')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MedicineDetailView: React.FC<{ medicine: Medicine; allMedicines: Medicine[]; onBack: () => void; onSelectMedicine: (m: Medicine) => void; onEdit: () => void; onDelete: () => void; }> = ({ medicine, allMedicines, onBack, onSelectMedicine, onEdit, onDelete }) => {
  const [openSection, setOpenSection] = useState<string | null>('indications');
  const variants = useMemo(() => allMedicines.filter(m => m.id !== medicine.id && m.fullName.split(' ')[0] === medicine.fullName.split(' ')[0]), [medicine, allMedicines]);
  return (
    <div className="flex flex-col h-screen bg-white overflow-x-hidden animate-in slide-in-from-right duration-300 relative z-50">
      <div className="bg-[#ED1C24] text-white pt-4 pb-4 px-4 sticky top-0 z-50 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-1 active:bg-white/20 rounded-full transition-colors"><ArrowLeft className="w-7 h-7" /></button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black truncate leading-none uppercase">{medicine.codeName}</h1>
            <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">{medicine.category}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={onEdit} className="p-2.5 active:bg-white/20 rounded-full transition-colors"><Edit2 className="w-6 h-6" /></button>
          <button onClick={onDelete} className="p-2.5 active:bg-white/20 rounded-full transition-colors"><Trash2 className="w-6 h-6" /></button>
          <button onClick={onBack} className="p-2.5 active:bg-white/20 rounded-full transition-colors"><Home className="w-6 h-6" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="bg-gradient-to-br from-[#FF4D4D] to-[#ED1C24] text-white p-8 shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-6">
              <h2 className="text-4xl font-black leading-[0.9] tracking-tighter uppercase">{medicine.fullName}</h2>
              {medicine.genericName && <p className="text-lg mt-3 italic font-bold text-red-50 leading-tight">{medicine.genericName}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {medicine.dosage && <span className="bg-white/25 px-4 py-1.5 rounded-full text-xs font-black shadow-inner uppercase">STR: {medicine.dosage}</span>}
                {medicine.details?.packSize && <span className="bg-white/25 px-4 py-1.5 rounded-full text-xs font-black shadow-inner uppercase">PACK: {medicine.details.packSize}</span>}
              </div>
            </div>
            <div className="bg-white/20 p-5 rounded-3xl border border-white/20 backdrop-blur-md shadow-2xl flex-none">
              <MedicineIcon type={medicine.type || medicine.fullName} className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
          </div>
          {variants.length > 0 && (
            <div className="mt-10">
              <h3 className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-4 flex items-center"><Layers className="w-3 h-3 mr-2" /> Variants</h3>
              <div className="flex flex-wrap gap-2">
                {variants.map(v => <button key={v.id} onClick={() => onSelectMedicine(v)} className="px-5 py-2.5 rounded-2xl text-xs bg-white text-[#ED1C24] font-black hover:bg-red-50 transition-all shadow-xl active:scale-95 uppercase">{v.dosage || v.type}</button>)}
              </div>
            </div>
          )}
        </div>
        <div className="bg-[#8B1015] px-8 py-6 flex justify-between items-center text-white border-t border-white/5 sticky top-[-1px] z-10 backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Unit Price</span>
            <span className="text-3xl font-black tracking-tight">{medicine.unitPrice || 'N/A'}</span>
          </div>
          <button className="px-8 py-3 bg-red-700/80 border border-white/10 rounded-2xl text-sm font-black uppercase">Translate</button>
        </div>
        <div className="divide-y divide-gray-100 pb-20">
          {['indications', 'adultDose', 'sideEffects', 'precautions'].map(sec => (
            <div key={sec} className="bg-white">
              <button onClick={() => setOpenSection(openSection === sec ? null : sec)} className={`w-full px-8 py-6 flex items-center justify-between text-slate-900 ${openSection === sec ? 'bg-red-50/40 border-l-4 border-[#ED1C24]' : 'bg-white'}`}>
                <span className="font-black text-lg uppercase tracking-tight">{sec.replace(/([A-Z])/g, ' $1')}</span>
                {openSection === sec ? <ChevronDown className="w-6 h-6 text-[#ED1C24]" /> : <ChevronRight className="w-6 h-6 text-gray-300" />}
              </button>
              {openSection === sec && <div className="px-20 pb-10 text-slate-700 text-lg leading-relaxed italic">{medicine.details?.[sec as keyof MedicineDetails] || `Info not available.`}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryView: React.FC<{ medicines: Medicine[], onSelect: (m: Medicine) => void, onEdit: (m: Medicine) => void }> = ({ medicines, onSelect, onEdit }) => {
  const sorted = [...medicines].sort((a, b) => b.addedAt - a.addedAt);
  return (
    <div className="space-y-4 p-4 animate-in fade-in duration-700 relative z-10">
      <h2 className="text-2xl font-black text-slate-900 uppercase">Recent Activity</h2>
      {sorted.map(med => (
        <div key={med.id} onClick={() => onSelect(med)} className="bg-white/30 backdrop-blur-lg p-5 rounded-2xl shadow-lg border-l-8 border-[#ED1C24] flex justify-between items-center border border-white/30">
          <div className="flex-1">
            <h3 className="font-black text-xl text-slate-900 uppercase">{med.fullName}</h3>
            <span className="text-[10px] font-black text-gray-600 uppercase">{med.codeName} • {new Date(med.addedAt).toLocaleDateString()}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onEdit(med); }} className="p-3 text-gray-400 hover:text-[#ED1C24]"><Edit2 className="w-5 h-5" /></button>
        </div>
      ))}
    </div>
  );
};

const SettingsView: React.FC<{ 
  onBack: () => void, categories: Category[], medicines: Medicine[], recycleBin: Medicine[],
  onAddCategory: (n: string) => void, onDeleteCategory: (n: string) => void, onDeleteMedicine: (id: string) => void,
  onRestoreMedicine: (id: string) => void, onPurgeMedicine: (id: string) => void, onImport: (data: any) => void
}> = ({ onBack, categories, medicines, recycleBin, onAddCategory, onDeleteCategory, onDeleteMedicine, onRestoreMedicine, onPurgeMedicine, onImport }) => {
  const [newCat, setNewCat] = useState('');
  const [activeTab, setActiveTab] = useState<'tabs' | 'backup' | 'data' | 'recycle'>('tabs');
  const [delSearch, setDelSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    return medicines.filter(m => 
      m.fullName.toLowerCase().includes(delSearch.toLowerCase()) || 
      m.codeName.toLowerCase().includes(delSearch.toLowerCase())
    );
  }, [medicines, delSearch]);

  const filteredRecycle = useMemo(() => {
    return recycleBin.filter(m => 
      m.fullName.toLowerCase().includes(delSearch.toLowerCase()) || 
      m.codeName.toLowerCase().includes(delSearch.toLowerCase())
    );
  }, [recycleBin, delSearch]);

  const exportData = () => {
    const data = { medicines, categories, recycleBin, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MedDB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImport(json);
      } catch (err) { alert("Invalid Backup File!"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] animate-in slide-in-from-right duration-300 relative z-50">
      <div className="bg-[#ED1C24] text-white py-6 px-6 flex items-center shadow-2xl sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2"><ArrowLeft className="w-7 h-7" /></button>
        <h1 className="ml-5 text-2xl font-black uppercase">Database Admin</h1>
      </div>
      <div className="flex bg-white shadow-md overflow-x-auto no-scrollbar">
        {['tabs', 'backup', 'data', 'recycle'].map((t) => (
          <button key={t} onClick={() => { setActiveTab(t as any); setDelSearch(''); }} className={`flex-none min-w-[100px] px-4 py-5 text-[10px] font-black uppercase flex items-center justify-center space-x-2 border-b-4 transition-all ${activeTab === t ? 'border-[#ED1C24] text-[#ED1C24] bg-red-50/30' : 'border-transparent text-gray-400'}`}>
            {t === 'tabs' ? <Layers className="w-4 h-4" /> : t === 'backup' ? <Save className="w-4 h-4" /> : t === 'data' ? <Database className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            <span>{t === 'data' ? 'Purge' : t}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'tabs' ? (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-white p-7 rounded-3xl shadow-xl border border-gray-100">
              <h2 className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-5">Add Nav Tab</h2>
              <div className="flex space-x-3">
                <input type="text" placeholder="TAB NAME" className="flex-1 px-5 py-4 border border-gray-200 rounded-2xl font-bold uppercase" value={newCat} onChange={e => setNewCat(e.target.value)} />
                <button onClick={() => { if(newCat.trim()){ onAddCategory(newCat.trim()); setNewCat(''); } }} className="bg-[#ED1C24] text-white px-6 py-4 rounded-2xl font-black shadow-lg"><Plus className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 divide-y divide-red-50 overflow-hidden">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between px-8 py-5">
                  <span className={`font-black uppercase ${['Code', 'Brand', 'Generic'].includes(cat) ? 'text-gray-300' : 'text-slate-800'}`}>{cat}</span>
                  {!['Code', 'Brand', 'Generic'].includes(cat) && <button onClick={() => onDeleteCategory(cat)} className="p-2.5 text-gray-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>}
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'backup' ? (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
              <Smartphone className="w-12 h-12 text-[#ED1C24] mx-auto mb-4" />
              <h3 className="font-black uppercase text-slate-800 mb-2">Device Storage</h3>
              <p className="text-sm text-slate-500 mb-6">Backup to local memory or restore from a JSON file.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={exportData} className="flex items-center justify-center space-x-2 py-4 bg-gray-50 text-[#ED1C24] rounded-2xl font-black uppercase text-xs border border-red-50 hover:bg-red-50">
                  <Download className="w-4 h-4" /> <span>Backup</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 py-4 bg-gray-50 text-blue-600 rounded-2xl font-black uppercase text-xs border border-blue-50 hover:bg-blue-50">
                  <Upload className="w-4 h-4" /> <span>Restore</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center opacity-60">
              <Cloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-black uppercase text-slate-800 mb-2">Google Drive</h3>
              <p className="text-sm text-slate-500 mb-6">Sync with your cloud storage.</p>
              <button onClick={() => alert("Google Drive Sync coming soon!")} className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center space-x-2">
                <Globe className="w-4 h-4" /> <span>Connect Drive</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'data' ? (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
              <input type="text" placeholder="Search to Delete..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-md outline-none font-bold uppercase text-xs" value={delSearch} onChange={e => setDelSearch(e.target.value)} />
            </div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 divide-y divide-red-50 overflow-hidden">
              {filteredData.length > 0 ? filteredData.map(m => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase text-slate-800">{m.fullName}</span>
                    <span className="text-[10px] font-bold text-red-500 uppercase">{m.codeName}</span>
                  </div>
                  <button onClick={() => onDeleteMedicine(m.id)} className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )) : <div className="p-10 text-center text-gray-300 font-black uppercase text-xs">No Data Found</div>}
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
              <input type="text" placeholder="Search in Bin..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-md outline-none font-bold uppercase text-xs" value={delSearch} onChange={e => setDelSearch(e.target.value)} />
            </div>
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 divide-y divide-blue-50 overflow-hidden">
              {filteredRecycle.length > 0 ? filteredRecycle.map(m => (
                <div key={m.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase text-slate-800">{m.fullName}</span>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">{m.codeName}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onRestoreMedicine(m.id)} className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => onPurgeMedicine(m.id)} className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-gray-300 font-black uppercase text-xs">Bin is Empty</div>}
            </div>
          </div>
        )}
      </div>
      <div className="p-8 text-center text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] pb-12 opacity-50">
        Drug International Ltd • Database Admin Panel
      </div>
    </div>
  );
};

export default App;
