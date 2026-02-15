import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Transaction, 
  UserProfile, 
  AppView, 
  TransactionType, 
  TransactionStatus,
  DetailCategory,
  Theme
} from './types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCIES } from './constants';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { ChartSection } from './components/ChartSection';
import { supabase } from './services/supabaseClient';
import { AuthScreen } from './components/AuthScreen';
import { Session } from '@supabase/supabase-js';
import { 
  User, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Edit2, 
  Save, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ArrowLeft, 
  List, 
  Plus, 
  Trash2, 
  Wallet,
  Cloud,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    // Total duration = 3.5s (wait) + 0.6s (exit) + small buffer
    const timer = setTimeout(() => {
      onComplete();
    }, 4500); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="z-10 flex flex-col items-center">
        {/* Logo Container - Outer handles Entrance, Inner handles Exit */}
        <div className="relative w-32 h-32 mb-6 animate-logo-entrance">
           <div className="w-full h-full animate-splash-exit flex items-center justify-center">
              <img 
                src="logo.png" 
                alt="Budgy Logo" 
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = document.getElementById('logo-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div id="logo-fallback" className="hidden w-full h-full bg-gradient-to-tr from-primary to-secondary rounded-3xl items-center justify-center shadow-lg shadow-indigo-500/30" style={{ display: 'none' }}>
                  <Wallet size={48} className="text-white" />
              </div>
           </div>
        </div>

        {/* Text Container - Outer handles Entrance, Inner handles Exit */}
        <div className="flex flex-col items-center animate-text-entrance">
          <div className="flex flex-col items-center animate-splash-exit">
            <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              Budgy
            </h1>
            <p className="mt-2 text-slate-400 text-sm font-medium tracking-widest uppercase">
              Finance Simplified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Splash State
  const [showSplash, setShowSplash] = useState(true);

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auth Session State
  const [session, setSession] = useState<Session | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // State
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Initialize User Profile from LocalStorage or Default
  // CHANGED: Default currency to '₹'
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('budgy_profile');
    return saved ? JSON.parse(saved) : {
      name: "User",
      currency: "₹", 
      monthlyBudget: 20000
    };
  });

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Transactions and Sync Logic
  const fetchTransactions = useCallback(async (currentSession: Session) => {
    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentSession.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  // Check for local data and sync to Supabase on login
  useEffect(() => {
    const syncLocalData = async () => {
      if (session && !isGuestMode) {
        const localTransactions = localStorage.getItem('budgy_guest_transactions');
        
        if (localTransactions) {
          setIsSyncing(true);
          try {
            const parsedTransactions: Transaction[] = JSON.parse(localTransactions);
            
            if (parsedTransactions.length > 0) {
              // Prepare transactions for insertion (remove local ID to allow UUID generation, add user_id)
              const recordsToInsert = parsedTransactions.map(({ id, ...rest }) => ({
                ...rest,
                user_id: session.user.id,
              }));

              const { error } = await supabase.from('transactions').insert(recordsToInsert);

              if (!error) {
                console.log("Sync successful, clearing local storage");
                localStorage.removeItem('budgy_guest_transactions');
              } else {
                console.error("Failed to sync transactions:", error);
              }
            }
          } catch (e) {
            console.error("Error during sync:", e);
          } finally {
            setIsSyncing(false);
            // Fetch fresh data including what we just synced
            fetchTransactions(session);
          }
        } else {
          // No local data, just fetch cloud data
          fetchTransactions(session);
        }
      } else if (isGuestMode) {
        // Load Guest Data
        const saved = localStorage.getItem('budgy_guest_transactions');
        if (saved) {
          setTransactions(JSON.parse(saved));
        } else {
          setTransactions([]);
        }
      } else {
        // Logged out state
        setTransactions([]);
      }
    };

    syncLocalData();
  }, [session, isGuestMode, fetchTransactions]);

  // Fetch Profile from Supabase
  useEffect(() => {
    if (isGuestMode) {
      localStorage.setItem('budgy_profile', JSON.stringify(userProfile));
      return;
    }

    if (!session?.user) return;

    const fetchProfile = async () => {
       const { data, error } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', session.user.id)
         .single();
       
       if (data) {
          setUserProfile({
             name: data.name || 'User',
             currency: data.currency || '₹', // Fallback to INR if missing
             monthlyBudget: data.monthly_budget || 20000
          });
          localStorage.setItem('budgy_profile', JSON.stringify({
             name: data.name || 'User',
             currency: data.currency || '₹',
             monthlyBudget: data.monthly_budget || 20000
          }));
       } else {
          // If no profile exists in DB, try to sync local profile settings once
          const localProfileStr = localStorage.getItem('budgy_profile');
          if (localProfileStr) {
            const localProfile = JSON.parse(localProfileStr);
            const { error: insertError } = await supabase.from('profiles').upsert({
              id: session.user.id,
              name: localProfile.name,
              currency: localProfile.currency,
              monthly_budget: localProfile.monthlyBudget,
              updated_at: new Date().toISOString()
            });
          } else if (session.user.user_metadata?.full_name) {
             setUserProfile(prev => ({ ...prev, name: session.user.user_metadata.full_name }));
          }
       }
    };

    fetchProfile();
  }, [session, isGuestMode]);

  // Dynamic Categories State
  const [expenseCategories, setExpenseCategories] = useState<string[]>(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(INCOME_CATEGORIES);

  // Filter State
  const [detailCategory, setDetailCategory] = useState<DetailCategory | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");

  // Settings Edit State
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [tempBudget, setTempBudget] = useState("");
  const [tempCurrency, setTempCurrency] = useState("");

  // Category Management State
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Form State for dynamic category switching
  const [addTransactionType, setAddTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived State for Dashboard
  const financials = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pending = 0;

    transactions.forEach(t => {
      if (t.status === TransactionStatus.PENDING) {
        pending += t.type === TransactionType.EXPENSE ? t.amount : 0; 
      } else {
        if (t.type === TransactionType.INCOME) income += t.amount;
        if (t.type === TransactionType.EXPENSE) expense += t.amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      pending
    };
  }, [transactions]);

  // Derived State for Detail View
  const filteredTransactions = useMemo(() => {
    if (view !== AppView.DETAILS || !detailCategory) return [];

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      // Date Filter
      const tDate = new Date(t.date);
      const inDateRange = tDate >= startOfMonth && tDate <= endOfMonth;
      
      if (!inDateRange) return false;

      // Category Filter
      if (detailCategory === 'PENDING') {
        return t.status === TransactionStatus.PENDING;
      } else if (detailCategory === 'INCOME') {
        return t.type === TransactionType.INCOME && t.status === TransactionStatus.COMPLETED;
      } else if (detailCategory === 'EXPENSE') {
        return t.type === TransactionType.EXPENSE && t.status === TransactionStatus.COMPLETED;
      }
      return false;
    });
  }, [transactions, view, detailCategory, currentDate]);

  const detailTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredTransactions]);

  // Handlers
  const handleSignOut = async () => {
    if (isGuestMode) {
      setIsGuestMode(false);
    } else {
      await supabase.auth.signOut();
    }
    setView(AppView.DASHBOARD);
  };

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const newTransactionData = {
      title: formData.get('title') as string,
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as TransactionType,
      status: formData.get('status') as TransactionStatus,
      category: formData.get('category') as string,
      date: formData.get('date') as string || new Date().toISOString(),
    };

    try {
      if (isGuestMode) {
        // Handle Guest Mode (Local Storage)
        const guestTransaction = {
          ...newTransactionData,
          id: Math.random().toString(36).substr(2, 9)
        };
        const updatedTransactions = [guestTransaction, ...transactions];
        setTransactions(updatedTransactions);
        localStorage.setItem('budgy_guest_transactions', JSON.stringify(updatedTransactions));
        setView(AppView.DASHBOARD);
      } else {
        // Handle Authenticated Mode (Supabase)
        // Note: ID is generated by DB default
        const { data, error } = await supabase
          .from('transactions')
          .insert([{
            ...newTransactionData,
            user_id: session?.user?.id 
          }])
          .select();

        if (error) {
          console.error('Error adding transaction:', error);
          alert('Failed to save transaction. Please check your connection.');
        } else if (data) {
          setTransactions([data[0], ...transactions]);
          setView(AppView.DASHBOARD);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (isGuestMode) {
        // Guest Mode Delete
        const updatedTransactions = transactions.filter(t => t.id !== id);
        setTransactions(updatedTransactions);
        localStorage.setItem('budgy_guest_transactions', JSON.stringify(updatedTransactions));
      } else {
        // Authenticated Delete
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting transaction:', error);
          alert('Failed to delete transaction.');
        } else {
          setTransactions(transactions.filter(t => t.id !== id));
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  const startEditingProfile = () => {
    setTempName(userProfile.name);
    setIsEditingProfile(true);
  };

  const saveProfile = async () => {
    if (tempName.trim()) {
      const newName = tempName.trim();
      setUserProfile(prev => ({ ...prev, name: newName }));
      
      if (isGuestMode) {
        localStorage.setItem('budgy_profile', JSON.stringify({ ...userProfile, name: newName }));
      } else if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: newName })
          .eq('id', session.user.id);
        
        if (error) console.error("Error updating profile name:", error);
      }
    }
    setIsEditingProfile(false);
  };

  const startEditingSettings = () => {
    setTempBudget(userProfile.monthlyBudget.toString());
    setTempCurrency(userProfile.currency);
    setIsEditingSettings(true);
  };

  const saveSettings = async () => {
    const newBudget = parseFloat(tempBudget);
    if (!isNaN(newBudget) && newBudget > 0) {
      const updatedProfile = {
        ...userProfile,
        monthlyBudget: newBudget,
        currency: tempCurrency
      };
      
      setUserProfile(updatedProfile);

      if (isGuestMode) {
        localStorage.setItem('budgy_profile', JSON.stringify(updatedProfile));
      } else if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            monthly_budget: newBudget,
            currency: tempCurrency 
          })
          .eq('id', session.user.id);
          
         if (error) console.error("Error updating settings:", error);
      }
    }
    setIsEditingSettings(false);
  };

  // Category Management Handlers
  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;

    if (activeCategoryTab === 'EXPENSE') {
      if (!expenseCategories.includes(name)) {
        setExpenseCategories([...expenseCategories, name]);
      }
    } else {
      if (!incomeCategories.includes(name)) {
        setIncomeCategories([...incomeCategories, name]);
      }
    }
    setNewCategoryName("");
  };

  const startEditingCategory = (index: number, currentName: string) => {
    setEditingCategoryIndex(index);
    setEditingCategoryName(currentName);
  };

  const saveCategoryEdit = (index: number) => {
    const newName = editingCategoryName.trim();
    if (!newName) return;

    const oldName = activeCategoryTab === 'EXPENSE' ? expenseCategories[index] : incomeCategories[index];

    if (activeCategoryTab === 'EXPENSE') {
      const updated = [...expenseCategories];
      updated[index] = newName;
      setExpenseCategories(updated);
      
      // Update transactions associated with this category
      setTransactions(prev => prev.map(t => 
        (t.type === TransactionType.EXPENSE && t.category === oldName) 
          ? { ...t, category: newName } 
          : t
      ));
    } else {
      const updated = [...incomeCategories];
      updated[index] = newName;
      setIncomeCategories(updated);

      // Update transactions associated with this category
      setTransactions(prev => prev.map(t => 
        (t.type === TransactionType.INCOME && t.category === oldName) 
          ? { ...t, category: newName } 
          : t
      ));
    }
    setEditingCategoryIndex(null);
    setEditingCategoryName("");
  };

  const deleteCategory = (index: number) => {
    if (activeCategoryTab === 'EXPENSE') {
      setExpenseCategories(expenseCategories.filter((_, i) => i !== index));
    } else {
      setIncomeCategories(incomeCategories.filter((_, i) => i !== index));
    }
  };

  const openDetails = (category: DetailCategory) => {
    setDetailCategory(category);
    setCurrentDate(new Date()); // Reset to current month
    setView(AppView.DETAILS);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Views
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello, {userProfile.name}</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1">
             {isGuestMode ? (
               <>Guest Mode Enabled</>
             ) : (
               <>
                 <Cloud size={12} className="text-primary" />
                 <span>Cloud Synced</span>
               </>
             )}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
             {userProfile.name[0]}
           </div>
        </div>
      </header>
      
      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="bg-primary/20 text-primary px-4 py-2 rounded-xl flex items-center justify-center gap-2 mb-4 animate-pulse">
           <RefreshCw size={16} className="animate-spin" />
           <span className="text-sm font-bold">Syncing your local data to cloud...</span>
        </div>
      )}

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-3xl shadow-xl shadow-indigo-900/20 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <span className="text-indigo-100 text-sm font-medium">Total Balance</span>
        <div className="text-4xl font-bold mt-2 mb-6">
          {userProfile.currency}{financials.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="flex justify-between items-end">
           <div className="flex flex-col">
             <span className="text-xs text-indigo-100 opacity-80 mb-1">Monthly Budget</span>
             <span className="text-sm font-semibold">{userProfile.currency}{userProfile.monthlyBudget.toLocaleString()}</span>
           </div>
           <div className="h-10 w-px bg-white/20 mx-4"></div>
           <div className="flex flex-col">
             <span className="text-xs text-indigo-100 opacity-80 mb-1">Spent</span>
             <span className="text-sm font-semibold">{((financials.expense / userProfile.monthlyBudget) * 100).toFixed(0)}%</span>
           </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard 
          title="Income" 
          amount={financials.income} 
          currency={userProfile.currency} 
          type="income" 
          onClick={() => openDetails('INCOME')}
        />
        <SummaryCard 
          title="Expenses" 
          amount={financials.expense} 
          currency={userProfile.currency} 
          type="expense" 
          onClick={() => openDetails('EXPENSE')}
        />
        <SummaryCard 
          title="Pending" 
          amount={financials.pending} 
          currency={userProfile.currency} 
          type="pending" 
          onClick={() => openDetails('PENDING')}
        />
      </div>

      {/* Charts */}
      <ChartSection transactions={transactions} />

      {/* List */}
      <div className="space-y-3 pb-24">
        <h3 className="text-slate-100 font-semibold text-lg px-1">Recent Transactions</h3>
        {isLoadingTransactions ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 size={32} className="text-primary animate-spin mb-2" />
            <p className="text-slate-500 text-sm">Loading data...</p>
          </div>
        ) : (
          <TransactionList transactions={transactions} currency={userProfile.currency} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );

  const renderDetails = () => {
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    let title = "Transactions";
    let accentColor = "text-white";
    if (detailCategory === 'INCOME') {
        title = "Income";
        accentColor = "text-success";
    } else if (detailCategory === 'EXPENSE') {
        title = "Expenses";
        accentColor = "text-danger";
    } else if (detailCategory === 'PENDING') {
        title = "Pending";
        accentColor = "text-warning";
    }

    return (
      <div className="animate-in fade-in slide-in-from-right duration-300 pb-20 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        {/* Calendar Mini Setup */}
        <div className="bg-card rounded-2xl border border-slate-700 p-2 mb-6 flex items-center justify-between shadow-lg shadow-black/20">
            <button 
              onClick={() => navigateMonth('prev')}
              className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex flex-col items-center">
               <span className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Month</span>
               <div className="flex items-center gap-2">
                 <Calendar size={16} className="text-primary" />
                 <span className="text-white font-bold">{monthName}</span>
               </div>
            </div>

            <button 
              onClick={() => navigateMonth('next')}
              className="p-3 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
        </div>

        {/* Total for Selected Period */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-5 rounded-2xl mb-6 flex justify-between items-center">
           <span className="text-slate-400">Total {title}</span>
           <span className={`text-2xl font-bold font-mono ${accentColor}`}>
             {userProfile.currency}{detailTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </span>
        </div>

        {/* List */}
        <div className="flex-1">
          {isLoadingTransactions ? (
             <div className="flex justify-center py-10">
               <Loader2 size={32} className="text-primary animate-spin" />
             </div>
          ) : (
            <TransactionList 
              transactions={filteredTransactions} 
              currency={userProfile.currency} 
              onDelete={handleDelete} 
            />
          )}
        </div>
      </div>
    );
  };

  const renderAddTransaction = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-300 pb-20">
        <h2 className="text-2xl font-bold text-white mb-6">New Transaction</h2>
        <form onSubmit={handleAddTransaction} className="space-y-5">
          
          <div className="bg-card p-1 rounded-xl flex border border-slate-700">
             <button
                type="button"
                onClick={() => setAddTransactionType(TransactionType.EXPENSE)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${addTransactionType === TransactionType.EXPENSE ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
               Expense
             </button>
             <button
                type="button"
                onClick={() => setAddTransactionType(TransactionType.INCOME)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${addTransactionType === TransactionType.INCOME ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
               Income
             </button>
             <input type="hidden" name="type" value={addTransactionType} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 ml-1">Title</label>
            <input 
              name="title" 
              required 
              placeholder="e.g. Weekly Groceries"
              className="w-full bg-card border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400 ml-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{userProfile.currency}</span>
              <input 
                name="amount" 
                type="number" 
                step="0.01" 
                required 
                placeholder="0.00"
                className="w-full bg-card border border-slate-700 rounded-xl p-4 pl-10 text-white focus:outline-none focus:border-primary transition-colors font-mono text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm text-slate-400 ml-1">Category</label>
                <select 
                  name="category" 
                  className="w-full bg-card border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary appearance-none"
                >
                  {(addTransactionType === TransactionType.EXPENSE ? expenseCategories : incomeCategories).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-sm text-slate-400 ml-1">Date</label>
                <input 
                  name="date" 
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-card border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary"
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm text-slate-400 ml-1">Status</label>
             <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input type="radio" name="status" value={TransactionStatus.COMPLETED} className="peer sr-only" defaultChecked />
                  <div className="bg-card border border-slate-700 rounded-xl p-4 text-center peer-checked:border-success peer-checked:bg-success/10 peer-checked:text-success transition-all flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Completed
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="status" value={TransactionStatus.PENDING} className="peer sr-only" />
                  <div className="bg-card border border-slate-700 rounded-xl p-4 text-center peer-checked:border-warning peer-checked:bg-warning/10 peer-checked:text-warning transition-all flex items-center justify-center gap-2">
                     <AlertCircle size={18} /> Pending
                  </div>
                </label>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 mt-4 flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : "Save Transaction"}
          </button>
        </form>
      </div>
    );
  };

  const renderProfile = () => {
    // Category Manager Sub-view
    if (isManagingCategories) {
      const currentList = activeCategoryTab === 'EXPENSE' ? expenseCategories : incomeCategories;
      
      return (
        <div className="animate-in fade-in slide-in-from-right duration-300 space-y-4 pb-20">
           <div className="flex items-center space-x-4 mb-4">
              <button 
                onClick={() => setIsManagingCategories(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-white">Manage Categories</h2>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl bg-card border border-slate-700 p-1 mb-4">
              <button
                onClick={() => setActiveCategoryTab('EXPENSE')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeCategoryTab === 'EXPENSE' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
              >
                Expense
              </button>
              <button
                onClick={() => setActiveCategoryTab('INCOME')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeCategoryTab === 'INCOME' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
              >
                Income
              </button>
            </div>

            {/* Add New */}
            <div className="flex gap-2 mb-6">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Add new category..."
                className="flex-1 bg-card border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
              />
              <button 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 text-white rounded-xl px-4 flex items-center justify-center"
              >
                <Plus size={24} />
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {currentList.map((cat, index) => (
                <div key={index} className="bg-card p-3 rounded-xl border border-slate-700 flex justify-between items-center group">
                  {editingCategoryIndex === index ? (
                     <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-primary"
                          autoFocus
                        />
                        <button onClick={() => saveCategoryEdit(index)} className="p-2 bg-success/20 text-success rounded-lg hover:bg-success/30">
                           <CheckCircle size={16} />
                        </button>
                        <button onClick={() => setEditingCategoryIndex(null)} className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600">
                           <X size={16} />
                        </button>
                     </div>
                  ) : (
                    <>
                      <span className="text-slate-200 font-medium ml-2">{cat}</span>
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => startEditingCategory(index, cat)}
                           className="p-2 text-slate-500 hover:text-primary hover:bg-slate-800 rounded-lg transition-colors"
                         >
                            <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => deleteCategory(index)}
                           className="p-2 text-slate-500 hover:text-danger hover:bg-slate-800 rounded-lg transition-colors"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {currentList.length === 0 && (
                <p className="text-center text-slate-500 py-8">No categories found.</p>
              )}
            </div>
        </div>
      );
    }

    // Standard Profile View
    const currencyCode = CURRENCIES.find(c => c.symbol === userProfile.currency)?.code || 'INR';

    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-300 space-y-6">
         <h2 className="text-2xl font-bold text-white mb-2">My Profile</h2>
         
         <div className="bg-card p-6 rounded-2xl border border-slate-700 flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 shrink-0">
               <User size={32} />
            </div>
            <div className="flex-1 min-w-0">
               {isEditingProfile ? (
                   <div className="flex items-center gap-2">
                       <input 
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:border-primary"
                          autoFocus
                          placeholder="Enter name"
                       />
                       <button onClick={saveProfile} className="p-2 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors">
                          <Save size={18} />
                       </button>
                       <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-colors">
                          <X size={18} />
                       </button>
                   </div>
               ) : (
                   <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white truncate">{userProfile.name}</h3>
                      <button 
                        onClick={startEditingProfile} 
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-700 rounded-lg transition-all"
                        aria-label="Edit Name"
                      >
                          <Edit2 size={16} />
                      </button>
                   </div>
               )}
               <p className="text-slate-400">
                  {isGuestMode ? "Guest Access" : "Standard Plan"}
               </p>
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex justify-between items-end mb-1">
              <h3 className="text-slate-400 font-medium text-sm uppercase tracking-wider ml-1">Settings</h3>
              {!isEditingSettings && (
                 <button onClick={startEditingSettings} className="flex items-center gap-1 text-primary text-xs font-bold hover:text-indigo-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors">
                    <Edit2 size={12} /> EDIT
                 </button>
              )}
            </div>
            
            <div className="bg-card rounded-2xl border border-slate-700 overflow-hidden">
               {/* Budget Row */}
               <div className="p-4 border-b border-slate-700 flex justify-between items-center h-16">
                  <span className="text-slate-200">Monthly Budget Goal</span>
                  {isEditingSettings ? (
                    <div className="flex items-center justify-end w-32">
                       <span className="text-slate-500 mr-2">{userProfile.currency}</span>
                       <input 
                          type="number"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white w-full text-right focus:outline-none focus:border-primary font-mono"
                       />
                    </div>
                  ) : (
                    <span className="text-primary font-mono font-bold">{userProfile.currency}{userProfile.monthlyBudget}</span>
                  )}
               </div>

               {/* Currency Row */}
               <div className="p-4 border-b border-slate-700 flex justify-between items-center h-16">
                  <span className="text-slate-200">Currency</span>
                  {isEditingSettings ? (
                     <select 
                        value={tempCurrency}
                        onChange={(e) => setTempCurrency(e.target.value)}
                        className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white w-40 text-sm focus:outline-none focus:border-primary"
                     >
                        {CURRENCIES.map(c => (
                           <option key={c.code} value={c.symbol}>{c.code} ({c.symbol})</option>
                        ))}
                     </select>
                  ) : (
                     <span className="text-slate-400">{userProfile.currency} ({currencyCode})</span>
                  )}
               </div>

               {/* Notifications Row (Read Only) */}
               <div className="p-4 flex justify-between items-center h-16">
                  <span className="text-slate-200">Notifications</span>
                  <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer opacity-80">
                     <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
               </div>

               {/* Theme Toggle Row */}
               <div className="p-4 flex justify-between items-center h-16">
                  <span className="text-slate-200">Theme</span>
                  <button 
                     onClick={toggleTheme}
                     className="bg-slate-800 border border-slate-700 rounded-lg p-2 flex items-center gap-2 transition-all hover:bg-slate-700"
                  >
                     {theme === 'dark' ? (
                       <>
                         <Moon size={18} className="text-purple-400" />
                         <span className="text-sm font-medium text-slate-300">Dark</span>
                       </>
                     ) : (
                       <>
                         <Sun size={18} className="text-orange-400" />
                         <span className="text-sm font-medium text-slate-300">Light</span>
                       </>
                     )}
                  </button>
               </div>

               {/* Save/Cancel Actions */}
               {isEditingSettings && (
                 <div className="p-3 bg-slate-800/50 flex gap-3 animate-in slide-in-from-top-2">
                    <button 
                       onClick={saveSettings} 
                       className="flex-1 bg-success hover:bg-emerald-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                       <CheckCircle size={16} /> Save Changes
                    </button>
                    <button 
                       onClick={() => setIsEditingSettings(false)} 
                       className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                       Cancel
                    </button>
                 </div>
               )}
            </div>

            {/* Manage Categories Button */}
            <button 
               onClick={() => setIsManagingCategories(true)}
               className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between group hover:border-slate-600 transition-colors"
            >
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                     <List size={20} />
                  </div>
                  <span className="text-slate-200 font-medium">Manage Categories</span>
               </div>
               <ChevronRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>

            <button 
               onClick={handleSignOut}
               className="w-full p-4 text-danger bg-danger/5 rounded-2xl border border-danger/20 font-medium hover:bg-danger/10 transition-colors"
            >
              {isGuestMode ? "Exit Guest Mode" : "Sign Out"}
            </button>
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans selection:bg-primary/30">
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : !session && !isGuestMode ? (
        <AuthScreen onGuestLogin={() => setIsGuestMode(true)} />
      ) : (
        <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-dark pb-20 animate-in fade-in duration-500">
          <main className="p-5 pt-8 min-h-[calc(100vh-80px)]">
            {view === AppView.DASHBOARD && renderDashboard()}
            {view === AppView.DETAILS && renderDetails()}
            {view === AppView.ADD_TRANSACTION && renderAddTransaction()}
            {view === AppView.PROFILE && renderProfile()}
          </main>
          
          <BottomNav currentView={view} onChangeView={setView} />
        </div>
      )}
    </div>
  );
};

export default App;