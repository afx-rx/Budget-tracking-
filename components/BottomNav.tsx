import React from 'react';
import { Home, PlusCircle, User } from 'lucide-react';
import { AppView } from '../types';

interface BottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const navItemClass = (view: AppView) => 
    `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
      currentView === view ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-card border-t border-slate-700 pb-safe z-50">
      <div className="relative flex justify-between items-center h-full max-w-md mx-auto px-10">
        
        <button onClick={() => onChangeView(AppView.DASHBOARD)} className={navItemClass(AppView.DASHBOARD)}>
          <Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* Centered Add Button */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2">
          <button 
            onClick={() => onChangeView(AppView.ADD_TRANSACTION)}
            className="flex items-center justify-center w-16 h-16 bg-primary hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/40 border-[6px] border-dark transition-transform active:scale-95"
            aria-label="Add Transaction"
          >
            <PlusCircle size={32} />
          </button>
        </div>

        <button onClick={() => onChangeView(AppView.PROFILE)} className={navItemClass(AppView.PROFILE)}>
          <User size={24} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
};