import React from 'react';
import { TrendingUp, TrendingDown, Clock, Wallet } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: number;
  currency: string;
  type: 'balance' | 'income' | 'expense' | 'pending';
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, currency, type, onClick }) => {
  let icon = <Wallet size={20} />;
  let colorClass = 'bg-blue-500/10 text-blue-500';

  if (type === 'income') {
    icon = <TrendingUp size={20} />;
    colorClass = 'bg-success/10 text-success';
  } else if (type === 'expense') {
    icon = <TrendingDown size={20} />;
    colorClass = 'bg-danger/10 text-danger';
  } else if (type === 'pending') {
    icon = <Clock size={20} />;
    colorClass = 'bg-warning/10 text-warning';
  }

  // Only render as button if onClick is provided (filtering out 'balance' usually)
  const Component = onClick ? 'button' : 'div';
  const interactionClasses = onClick 
    ? "cursor-pointer hover:bg-slate-800/50 active:scale-95 transition-all" 
    : "";

  return (
    <Component 
      onClick={onClick}
      className={`bg-card p-4 rounded-2xl border border-slate-700 flex flex-col items-start min-w-[140px] flex-1 text-left ${interactionClasses}`}
    >
      <div className={`p-2 rounded-full mb-3 ${colorClass}`}>
        {icon}
      </div>
      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
      <span className="text-xl font-bold text-slate-100 mt-1">
        {currency}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </Component>
  );
};
