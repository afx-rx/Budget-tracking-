import React from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { ArrowUpRight, ArrowDownLeft, Clock, Trash2, Check } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  currency: string;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: TransactionStatus) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, currency, onDelete, onStatusChange }) => {
  // Sort by date desc
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3 pb-24">
      <h3 className="text-slate-100 font-semibold text-lg px-1">Recent Transactions</h3>
      {sorted.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          No transactions found.
        </div>
      )}
      {sorted.map(t => (
        <div key={t.id} className="bg-card p-4 rounded-xl border border-slate-700 flex items-center justify-between group relative overflow-hidden">
          <div className="flex items-center space-x-4 z-10">
            <div className={`p-3 rounded-full ${
              t.status === TransactionStatus.PENDING 
                ? 'bg-slate-700 text-slate-400' 
                : t.type === TransactionType.INCOME 
                  ? 'bg-success/10 text-success' 
                  : 'bg-danger/10 text-danger'
            }`}>
              {t.status === TransactionStatus.PENDING ? <Clock size={20} /> : (
                 t.type === TransactionType.INCOME ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />
              )}
            </div>
            <div>
              <p className="text-slate-100 font-medium">{t.title}</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">{t.category}</span>
                <span className="text-[10px] text-slate-500">• {new Date(t.date).toLocaleDateString()}</span>
                {t.status === TransactionStatus.PENDING && (
                  <span className="text-[10px] bg-warning/20 text-warning px-1.5 rounded">Pending</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end z-10 gap-2">
             <span className={`font-bold ${
               t.type === TransactionType.INCOME ? 'text-success' : 'text-slate-100'
             } ${t.status === TransactionStatus.PENDING ? 'opacity-60' : ''}`}>
               {t.type === TransactionType.INCOME ? '+' : '-'}{currency}{t.amount.toLocaleString()}
             </span>
             
             <div className="flex items-center gap-2">
               {t.status === TransactionStatus.PENDING && onStatusChange && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(t.id, TransactionStatus.COMPLETED);
                    }}
                    className="p-2 bg-slate-800 text-slate-400 hover:text-success hover:bg-success/10 rounded-full transition-colors border border-slate-600 hover:border-success"
                    title="Mark as Completed"
                  >
                    <Check size={14} />
                  </button>
               )}
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete(t.id);
                 }}
                 className="p-2 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                 title="Delete"
               >
                  <Trash2 size={14} />
               </button>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};